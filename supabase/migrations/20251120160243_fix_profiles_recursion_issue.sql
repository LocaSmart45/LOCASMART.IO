/*
  # Fix Profiles Infinite Recursion

  ## Problem
  The "Users can view profiles" policy causes infinite recursion because it queries
  the profiles table from within a profiles policy check.

  ## Solution
  Use auth.jwt() to check the role instead of querying the profiles table.
  The role is already stored in the JWT metadata.

  ## Changes
  - Drop the recursive policy
  - Create a new policy that uses auth.jwt() to check admin role
  - No more recursion!
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

-- Create a non-recursive policy using JWT metadata
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile
    id = (select auth.uid())
    OR
    -- Admins can view all profiles (role stored in JWT)
    (COALESCE((select auth.jwt()->>'role'), '') = 'admin')
  );

-- Make sure the role is synced to JWT when profiles are created/updated
-- This is already handled by the update_user_metadata trigger
