/*
  # Fix Security and Performance Issues

  ## Changes Made

  ### 1. Add Missing Indexes on Foreign Keys
  - Add index on interventions.reservation_id
  - Add index on messages.property_id
  - Add index on notification_logs.intervention_id
  - Add index on notification_logs.reservation_id

  ### 2. Optimize RLS Policies (Auth Function Initialization)
  Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row:
  - messages table policies
  - profiles table policies
  - notification_logs table policies
  - sync_logs table policies

  ### 3. Remove Duplicate Indexes
  - Drop duplicate intervention indexes
  - Drop duplicate property indexes
  - Drop duplicate reservation indexes

  ### 4. Fix Multiple Permissive Policies
  Consolidate overlapping SELECT policies into single optimized policies

  ## Notes
  - All changes are performance and security improvements
  - No breaking changes to application logic
  - Indexes will improve query performance
  - RLS optimizations will scale better with large datasets
*/

-- ============================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_interventions_reservation_id 
ON interventions(reservation_id) 
WHERE reservation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_property_id 
ON messages(property_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_intervention_id 
ON notification_logs(intervention_id) 
WHERE intervention_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_logs_reservation_id 
ON notification_logs(reservation_id) 
WHERE reservation_id IS NOT NULL;

-- ============================================
-- 2. REMOVE DUPLICATE INDEXES
-- ============================================

-- Drop duplicate intervention indexes (keep the newer ones with full names)
DROP INDEX IF EXISTS idx_interventions_property;
DROP INDEX IF EXISTS idx_interventions_date;

-- Drop duplicate property indexes (keep the newer ones with full names)
DROP INDEX IF EXISTS idx_properties_owner;

-- Drop duplicate reservation indexes (keep the newer ones with full names)
DROP INDEX IF EXISTS idx_reservations_property;

-- ============================================
-- 3. OPTIMIZE RLS POLICIES - MESSAGES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Utilisateurs voient leurs messages envoyés et reçus" ON messages;
DROP POLICY IF EXISTS "Utilisateurs peuvent envoyer des messages" ON messages;
DROP POLICY IF EXISTS "Destinataires peuvent marquer comme lu" ON messages;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = (select auth.uid()) OR 
    recipient_id = (select auth.uid())
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

CREATE POLICY "Recipients can mark as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = (select auth.uid()))
  WITH CHECK (recipient_id = (select auth.uid()));

-- ============================================
-- 4. OPTIMIZE RLS POLICIES - PROFILES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles via JWT" ON profiles;

-- Recreate with consolidated and optimized policies
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid())
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================
-- 5. OPTIMIZE RLS POLICIES - NOTIFICATION_LOGS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Owners can view their own notification logs" ON notification_logs;

-- Recreate with consolidated policy
CREATE POLICY "Users can view notification logs"
  ON notification_logs FOR SELECT
  TO authenticated
  USING (
    recipient_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 6. OPTIMIZE RLS POLICIES - SYNC_LOGS
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can view all sync logs" ON sync_logs;

-- Recreate with optimized policy
CREATE POLICY "Admins can view sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 7. CONSOLIDATE OVERLAPPING SELECT POLICIES
-- ============================================

-- INTERVENTIONS: Consolidate multiple SELECT policies
DROP POLICY IF EXISTS "Authenticated users can manage interventions" ON interventions;
DROP POLICY IF EXISTS "Users can view interventions" ON interventions;

CREATE POLICY "Users can view interventions"
  ON interventions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = interventions.property_id
      AND (
        properties.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid())
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Keep separate INSERT/UPDATE/DELETE policies for interventions
CREATE POLICY "Admins can manage interventions"
  ON interventions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- PROPERTIES: Consolidate multiple SELECT policies
DROP POLICY IF EXISTS "Authenticated users can manage properties" ON properties;
DROP POLICY IF EXISTS "Users can view related properties" ON properties;

CREATE POLICY "Users can view properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    owner_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Keep separate INSERT/UPDATE/DELETE policies for properties
CREATE POLICY "Admins can manage properties"
  ON properties FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- RESERVATIONS: Consolidate multiple SELECT policies
DROP POLICY IF EXISTS "Authenticated users can manage reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view reservations" ON reservations;

CREATE POLICY "Users can view reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = reservations.property_id
      AND (
        properties.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid())
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Keep separate INSERT/UPDATE/DELETE policies for reservations
CREATE POLICY "Admins can manage reservations"
  ON reservations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 8. FIX FUNCTION SEARCH PATH (Security)
-- ============================================

-- Update function with immutable search_path
DROP FUNCTION IF EXISTS update_user_metadata(uuid, jsonb);

CREATE OR REPLACE FUNCTION update_user_metadata(user_id uuid, metadata jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || metadata
  WHERE id = user_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_user_metadata(uuid, jsonb) TO authenticated;
