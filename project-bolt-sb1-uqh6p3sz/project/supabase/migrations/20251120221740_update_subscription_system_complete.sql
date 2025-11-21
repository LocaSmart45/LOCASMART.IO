/*
  # Update Complete Subscription and Billing System

  ## Changes Made

  ### 1. Update Subscription Plans
  - Correct pricing: Starter 19€, Pro 49€, Premium 99€
  - Add all missing feature flags (monthly_reports, CSV/PDF exports)

  ### 2. Add Owner Billing Information
  - Add billing fields to profiles for owners
  - Used for invoice generation

  ### 3. Add Invoice Snapshots
  - Snapshot owner billing info when invoice is created
  - Ensures historical accuracy

  ### 4. Create Invoice Counter Table
  - Proper invoice numbering per agency per year
  - Format: YYYY-NNNN

  ### 5. Update Invoice Generation Logic
  - Use snapshots for owner info
  - Use counter for invoice numbers
*/

-- ============================================
-- 1. UPDATE SUBSCRIPTION PLANS TABLE
-- ============================================

-- Add missing columns to subscription_plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'exports_csv_enabled'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN exports_csv_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'exports_pdf_enabled'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN exports_pdf_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'monthly_reports_enabled'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN monthly_reports_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Remove old exports_enabled column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'exports_enabled'
  ) THEN
    ALTER TABLE subscription_plans DROP COLUMN exports_enabled;
  END IF;
END $$;

-- ============================================
-- 2. ADD OWNER BILLING INFORMATION TO PROFILES
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'billing_full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_full_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'billing_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'billing_zip'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_zip text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'billing_city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'billing_country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_country text DEFAULT 'France';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'billing_email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_email text;
  END IF;
END $$;

-- ============================================
-- 3. ADD INVOICE SNAPSHOTS FOR OWNER INFO
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'owner_name_snapshot'
  ) THEN
    ALTER TABLE invoices ADD COLUMN owner_name_snapshot text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'owner_billing_address_snapshot'
  ) THEN
    ALTER TABLE invoices ADD COLUMN owner_billing_address_snapshot text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'owner_billing_zip_snapshot'
  ) THEN
    ALTER TABLE invoices ADD COLUMN owner_billing_zip_snapshot text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'owner_billing_city_snapshot'
  ) THEN
    ALTER TABLE invoices ADD COLUMN owner_billing_city_snapshot text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'owner_billing_country_snapshot'
  ) THEN
    ALTER TABLE invoices ADD COLUMN owner_billing_country_snapshot text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'owner_email_snapshot'
  ) THEN
    ALTER TABLE invoices ADD COLUMN owner_email_snapshot text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'invoice_date'
  ) THEN
    ALTER TABLE invoices ADD COLUMN invoice_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- ============================================
-- 4. CREATE INVOICE COUNTER TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agency_invoice_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year int NOT NULL,
  last_number int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(admin_user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_invoice_counters_admin_year 
ON agency_invoice_counters(admin_user_id, year);

ALTER TABLE agency_invoice_counters ENABLE ROW LEVEL SECURITY;

-- Admin can view and manage their own counters
CREATE POLICY "Admins can view own invoice counters"
  ON agency_invoice_counters FOR SELECT
  TO authenticated
  USING (admin_user_id = (select auth.uid()));

CREATE POLICY "Admins can insert own invoice counters"
  ON agency_invoice_counters FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = (select auth.uid()));

CREATE POLICY "Admins can update own invoice counters"
  ON agency_invoice_counters FOR UPDATE
  TO authenticated
  USING (admin_user_id = (select auth.uid()))
  WITH CHECK (admin_user_id = (select auth.uid()));

-- ============================================
-- 5. UPDATE INVOICE NUMBER GENERATION FUNCTION
-- ============================================

-- Drop old function
DROP FUNCTION IF EXISTS generate_invoice_number(uuid);

-- Create new function that uses counter table
CREATE OR REPLACE FUNCTION generate_invoice_number_with_counter(admin_id uuid, invoice_year int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_number int;
  invoice_num text;
BEGIN
  -- Insert or update counter for this admin and year
  INSERT INTO agency_invoice_counters (admin_user_id, year, last_number)
  VALUES (admin_id, invoice_year, 1)
  ON CONFLICT (admin_user_id, year) 
  DO UPDATE SET 
    last_number = agency_invoice_counters.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO new_number;
  
  -- Format: YYYY-NNNN (e.g., 2025-0001)
  invoice_num := invoice_year::text || '-' || LPAD(new_number::text, 4, '0');
  
  RETURN invoice_num;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_invoice_number_with_counter(uuid, int) TO authenticated;

-- ============================================
-- 6. UPDATE BRANDING FIELDS IN AGENCY SETTINGS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agency_billing_settings' AND column_name = 'branding_primary_color'
  ) THEN
    ALTER TABLE agency_billing_settings ADD COLUMN branding_primary_color text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agency_billing_settings' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE agency_billing_settings RENAME COLUMN logo_url TO branding_logo_url;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agency_billing_settings' AND column_name = 'branding_logo_url'
  ) THEN
    ALTER TABLE agency_billing_settings ADD COLUMN branding_logo_url text;
  END IF;
END $$;

-- ============================================
-- 7. UPDATE DEFAULT SUBSCRIPTION TRIGGERS
-- ============================================

-- Update default subscription function with correct pricing
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO subscription_plans (
      admin_user_id,
      plan,
      properties_limit,
      users_limit,
      sync_auto_enabled,
      notifications_enabled,
      exports_csv_enabled,
      exports_pdf_enabled,
      branding_enabled,
      monthly_reports_enabled
    ) VALUES (
      NEW.id,
      'starter',
      5,
      1,
      false,
      false,
      false,
      false,
      false,
      false
    )
    ON CONFLICT (admin_user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update existing subscriptions to correct plan limits
UPDATE subscription_plans SET
  properties_limit = CASE 
    WHEN plan = 'starter' THEN 5
    WHEN plan = 'pro' THEN 20
    WHEN plan = 'premium' THEN NULL
    ELSE properties_limit
  END,
  users_limit = CASE 
    WHEN plan = 'starter' THEN 1
    WHEN plan = 'pro' THEN 3
    WHEN plan = 'premium' THEN NULL
    ELSE users_limit
  END,
  exports_csv_enabled = CASE
    WHEN plan IN ('pro', 'premium') THEN true
    ELSE false
  END,
  exports_pdf_enabled = CASE
    WHEN plan = 'premium' THEN true
    ELSE false
  END,
  monthly_reports_enabled = CASE
    WHEN plan = 'premium' THEN true
    ELSE false
  END
WHERE plan IN ('starter', 'pro', 'premium');

-- Add comment explaining plan pricing
COMMENT ON TABLE subscription_plans IS 'B2B Subscription plans: Starter (19€/month), Pro (49€/month), Premium (99€/month). Payment handled via Système.io.';
