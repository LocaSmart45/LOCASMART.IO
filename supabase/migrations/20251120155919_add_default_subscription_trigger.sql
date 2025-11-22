/*
  # Add Default Subscription for New Admins

  ## Changes Made

  ### 1. Create Function to Initialize Subscription
  Automatically creates a starter subscription when a new admin profile is created

  ### 2. Create Trigger
  Triggers the function after insert on profiles table for admin users

  ## Notes
  - All new admins get the starter plan by default
  - Can be upgraded later via the subscription management page
*/

-- Function to create default subscription for new admin
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
      exports_enabled,
      branding_enabled
    ) VALUES (
      NEW.id,
      'starter',
      10,
      1,
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

-- Create trigger for new admin profiles
DROP TRIGGER IF EXISTS create_default_subscription_trigger ON profiles;
CREATE TRIGGER create_default_subscription_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'admin')
  EXECUTE FUNCTION create_default_subscription();

-- Also create default billing settings
CREATE OR REPLACE FUNCTION create_default_billing_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO agency_billing_settings (
      admin_user_id,
      company_name,
      billing_country,
      apply_vat,
      vat_rate
    ) VALUES (
      NEW.id,
      '',
      'France',
      false,
      20.0
    )
    ON CONFLICT (admin_user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for billing settings
DROP TRIGGER IF EXISTS create_default_billing_settings_trigger ON profiles;
CREATE TRIGGER create_default_billing_settings_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'admin')
  EXECUTE FUNCTION create_default_billing_settings();

-- Create default records for existing admins
DO $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    -- Insert subscription if not exists
    INSERT INTO subscription_plans (
      admin_user_id,
      plan,
      properties_limit,
      users_limit,
      sync_auto_enabled,
      notifications_enabled,
      exports_enabled,
      branding_enabled
    ) VALUES (
      admin_record.id,
      'starter',
      10,
      1,
      false,
      false,
      false,
      false
    )
    ON CONFLICT (admin_user_id) DO NOTHING;
    
    -- Insert billing settings if not exists
    INSERT INTO agency_billing_settings (
      admin_user_id,
      company_name,
      billing_country,
      apply_vat,
      vat_rate
    ) VALUES (
      admin_record.id,
      '',
      'France',
      false,
      20.0
    )
    ON CONFLICT (admin_user_id) DO NOTHING;
  END LOOP;
END $$;
