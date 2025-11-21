/*
  # Add Subscription and Billing System

  ## Changes Made

  ### 1. Subscription Plans Table
  - Stores B2B subscription information for each admin/agency
  - Plans: starter, pro, premium with different limits
  - No payment processing (handled via Système.io)

  ### 2. Agency Billing Settings Table
  - Stores company/legal information for invoice generation
  - SIRET, VAT, banking details, invoice footer

  ### 3. Update Reservations Table
  - Add financial calculation fields:
    - cleaning_fee (paid by guest)
    - cleaning_cost (actual cost)
    - cleaning_margin (fee - cost)
    - revenue_amount (total - cleaning_fee)
  - Use existing commission_amount field

  ### 4. Invoices Table
  - Monthly B2C invoices for property owners
  - Aggregates all reservations for a period

  ### 5. Invoice Items Table
  - Line items for each invoice
  - Links to specific reservations

  ## Security
  - RLS enabled on all tables
  - Multi-agency isolation enforced
  - Admins access only their own data
  - Owners access only their own invoices
*/

-- ============================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('starter', 'pro', 'premium')),
  properties_limit int,
  users_limit int,
  sync_auto_enabled boolean DEFAULT false,
  notifications_enabled boolean DEFAULT false,
  exports_enabled boolean DEFAULT false,
  branding_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(admin_user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_admin 
ON subscription_plans(admin_user_id);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Admin can view and update their own subscription
CREATE POLICY "Admins can view own subscription"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (admin_user_id = (select auth.uid()));

CREATE POLICY "Admins can update own subscription"
  ON subscription_plans FOR UPDATE
  TO authenticated
  USING (admin_user_id = (select auth.uid()))
  WITH CHECK (admin_user_id = (select auth.uid()));

CREATE POLICY "Admins can insert own subscription"
  ON subscription_plans FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = (select auth.uid()));

-- ============================================
-- 2. AGENCY BILLING SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agency_billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT '',
  legal_form text DEFAULT '',
  billing_address text DEFAULT '',
  billing_zip text DEFAULT '',
  billing_city text DEFAULT '',
  billing_country text DEFAULT 'France',
  siret_number text DEFAULT '',
  vat_number text,
  apply_vat boolean DEFAULT false,
  vat_rate float DEFAULT 20.0,
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  iban text DEFAULT '',
  bic text DEFAULT '',
  invoice_footer_text text DEFAULT '',
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(admin_user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_billing_admin 
ON agency_billing_settings(admin_user_id);

ALTER TABLE agency_billing_settings ENABLE ROW LEVEL SECURITY;

-- Admin can view and manage their own billing settings
CREATE POLICY "Admins can view own billing settings"
  ON agency_billing_settings FOR SELECT
  TO authenticated
  USING (admin_user_id = (select auth.uid()));

CREATE POLICY "Admins can update own billing settings"
  ON agency_billing_settings FOR UPDATE
  TO authenticated
  USING (admin_user_id = (select auth.uid()))
  WITH CHECK (admin_user_id = (select auth.uid()));

CREATE POLICY "Admins can insert own billing settings"
  ON agency_billing_settings FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = (select auth.uid()));

-- ============================================
-- 3. UPDATE RESERVATIONS TABLE
-- ============================================

-- Add financial calculation fields (keeping existing commission_amount)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'cleaning_fee'
  ) THEN
    ALTER TABLE reservations ADD COLUMN cleaning_fee decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'cleaning_cost'
  ) THEN
    ALTER TABLE reservations ADD COLUMN cleaning_cost decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'cleaning_margin'
  ) THEN
    ALTER TABLE reservations ADD COLUMN cleaning_margin decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'revenue_amount'
  ) THEN
    ALTER TABLE reservations ADD COLUMN revenue_amount decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create function to recalculate reservation finances
CREATE OR REPLACE FUNCTION recalculate_reservation_finances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  property_commission_rate decimal(5,2);
BEGIN
  -- Get commission rate from property
  SELECT commission_rate INTO property_commission_rate
  FROM properties
  WHERE id = NEW.property_id;

  -- Calculate cleaning margin
  NEW.cleaning_margin := COALESCE(NEW.cleaning_fee, 0) - COALESCE(NEW.cleaning_cost, 0);

  -- Calculate revenue amount (total - cleaning fee)
  NEW.revenue_amount := COALESCE(NEW.total_amount, 0) - COALESCE(NEW.cleaning_fee, 0);

  -- Recalculate commission based on revenue_amount and property commission_rate
  NEW.commission_amount := NEW.revenue_amount * (COALESCE(property_commission_rate, 0) / 100);

  RETURN NEW;
END;
$$;

-- Create trigger for automatic calculation
DROP TRIGGER IF EXISTS recalculate_reservation_finances_trigger ON reservations;
CREATE TRIGGER recalculate_reservation_finances_trigger
  BEFORE INSERT OR UPDATE OF total_amount, cleaning_fee, cleaning_cost, property_id
  ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_reservation_finances();

-- ============================================
-- 4. INVOICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_revenue decimal(10,2) DEFAULT 0,
  total_cleaning_fees decimal(10,2) DEFAULT 0,
  total_cleaning_costs decimal(10,2) DEFAULT 0,
  cleaning_margin_total decimal(10,2) DEFAULT 0,
  total_commission decimal(10,2) DEFAULT 0,
  owner_net_amount decimal(10,2) DEFAULT 0,
  vat_amount decimal(10,2) DEFAULT 0,
  total_with_vat decimal(10,2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  due_date date,
  pdf_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_admin ON invoices(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON invoices(period_start, period_end);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Owners can view their own invoices
CREATE POLICY "Owners can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- Admins can view and manage invoices for their owners
CREATE POLICY "Admins can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (admin_user_id = (select auth.uid()));

CREATE POLICY "Admins can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = (select auth.uid()));

CREATE POLICY "Admins can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (admin_user_id = (select auth.uid()))
  WITH CHECK (admin_user_id = (select auth.uid()));

CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (admin_user_id = (select auth.uid()));

-- ============================================
-- 5. INVOICE ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  property_name text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guest_name text,
  revenue_amount decimal(10,2) DEFAULT 0,
  cleaning_fee decimal(10,2) DEFAULT 0,
  cleaning_cost decimal(10,2) DEFAULT 0,
  cleaning_margin decimal(10,2) DEFAULT 0,
  commission_rate decimal(5,2) DEFAULT 0,
  commission_amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_reservation ON invoice_items(reservation_id);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Owners can view items of their own invoices
CREATE POLICY "Owners can view own invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.owner_id = (select auth.uid())
    )
  );

-- Admins can view and manage invoice items for their invoices
CREATE POLICY "Admins can view invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.admin_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can insert invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.admin_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update invoice items"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.admin_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can delete invoice items"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.admin_user_id = (select auth.uid())
    )
  );

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to get admin user ID from owner
CREATE OR REPLACE FUNCTION get_admin_for_owner(owner_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get admin from any property owned by this owner
  SELECT DISTINCT p.admin_user_id INTO admin_id
  FROM properties p
  WHERE p.owner_id = owner_user_id
  LIMIT 1;
  
  RETURN admin_id;
END;
$$;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(admin_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invoice_count int;
  year_suffix text;
BEGIN
  -- Count existing invoices for this admin
  SELECT COUNT(*) INTO invoice_count
  FROM invoices
  WHERE admin_user_id = admin_id;
  
  year_suffix := TO_CHAR(NOW(), 'YY');
  
  RETURN 'FAC-' || year_suffix || '-' || LPAD((invoice_count + 1)::text, 5, '0');
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add update triggers
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agency_billing_settings_updated_at ON agency_billing_settings;
CREATE TRIGGER update_agency_billing_settings_updated_at
  BEFORE UPDATE ON agency_billing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_admin_for_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number(uuid) TO authenticated;
