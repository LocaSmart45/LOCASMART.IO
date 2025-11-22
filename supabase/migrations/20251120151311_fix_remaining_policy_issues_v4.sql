/*
  # Fix Remaining Security Issues

  ## Changes Made

  ### 1. Fix Multiple Permissive Policies
  Split admin FOR ALL policies into separate INSERT/UPDATE/DELETE policies
  to avoid multiple SELECT policies.

  ### 2. Re-fix Function Search Path
  There are TWO functions named update_user_metadata:
  - One is a trigger function (no args, returns trigger)
  - One is a regular function (uuid, jsonb args, returns void)
  Both need immutable search_path.

  ## Notes
  - Unused indexes are kept - they're new and will be used in production
  - Leaked Password Protection is not configurable in Supabase (can be ignored)
*/

-- ============================================
-- 1. FIX MULTIPLE PERMISSIVE POLICIES
-- ============================================

-- INTERVENTIONS: Remove SELECT from admin FOR ALL policy
DROP POLICY IF EXISTS "Admins can manage interventions" ON interventions;

CREATE POLICY "Admins can insert interventions"
  ON interventions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update interventions"
  ON interventions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete interventions"
  ON interventions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- PROPERTIES: Remove SELECT from admin FOR ALL policy
DROP POLICY IF EXISTS "Admins can manage properties" ON properties;

CREATE POLICY "Admins can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- RESERVATIONS: Remove SELECT from admin FOR ALL policy
DROP POLICY IF EXISTS "Admins can manage reservations" ON reservations;

CREATE POLICY "Admins can insert reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete reservations"
  ON reservations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 2. FIX FUNCTION SEARCH PATH
-- ============================================

-- Drop trigger temporarily
DROP TRIGGER IF EXISTS on_profile_role_update ON profiles;

-- Recreate the trigger function with immutable search_path
CREATE OR REPLACE FUNCTION public.update_user_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Recreate the helper function with immutable search_path
CREATE OR REPLACE FUNCTION public.update_user_metadata(user_id uuid, metadata jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || metadata
  WHERE id = user_id;
END;
$$;

-- Set proper permissions
REVOKE ALL ON FUNCTION public.update_user_metadata() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_user_metadata(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_metadata(uuid, jsonb) TO authenticated;

-- Recreate the trigger
CREATE TRIGGER on_profile_role_update
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_metadata();

-- Add comments
COMMENT ON FUNCTION public.update_user_metadata() IS 'Trigger function to sync profile role to JWT with immutable search_path';
COMMENT ON FUNCTION public.update_user_metadata(uuid, jsonb) IS 'Helper function to update user metadata with immutable search_path';
