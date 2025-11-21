/*
  # Add Missing Metadata Sync Trigger

  ## Problem
  The function update_user_metadata() exists but the trigger to call it was never created.
  This means the role is not synced to the JWT, causing RLS policies to fail.

  ## Solution
  Create the trigger to sync role to auth.users.raw_app_meta_data whenever a profile is created or updated.

  ## Changes
  - Create trigger on profiles table
  - Sync existing profiles' roles to JWT
*/

-- Create the trigger to sync role to JWT
DROP TRIGGER IF EXISTS on_profile_created_or_updated ON profiles;
CREATE TRIGGER on_profile_created_or_updated
  AFTER INSERT OR UPDATE OF role
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metadata();

-- Sync all existing profiles' roles to JWT
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id, role FROM profiles
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', profile_record.role)
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Add comment
COMMENT ON TRIGGER on_profile_created_or_updated ON profiles IS 
  'Syncs the role from profiles table to auth.users.raw_app_meta_data for JWT access';
