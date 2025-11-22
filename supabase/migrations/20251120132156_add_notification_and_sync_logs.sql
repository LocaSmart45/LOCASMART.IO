/*
  # Add Notification and Sync Logging Tables

  ## New Tables
  
  ### `notification_logs`
  Tracks all email notifications sent by the system
  - `id` (uuid, primary key)
  - `type` (text) - Type of notification: NEW_RESERVATION, INTERVENTION_SCHEDULED, INTERVENTION_REMINDER, RESERVATION_MODIFIED, RESERVATION_CANCELLED
  - `recipient_id` (uuid) - Reference to profiles table (who receives the email)
  - `reservation_id` (uuid, nullable) - Reference to reservation if applicable
  - `intervention_id` (uuid, nullable) - Reference to intervention if applicable
  - `status` (text) - Status: SENT, FAILED, PENDING
  - `error` (text, nullable) - Error message if failed
  - `sent_at` (timestamptz) - When the notification was sent
  - `created_at` (timestamptz) - When the log was created
  
  ### `sync_logs`
  Tracks automatic iCal synchronization runs
  - `id` (uuid, primary key)
  - `started_at` (timestamptz) - When the sync started
  - `finished_at` (timestamptz, nullable) - When the sync finished
  - `status` (text) - Status: RUNNING, COMPLETED, FAILED
  - `properties_synced` (integer) - Number of properties processed
  - `reservations_created` (integer) - Number of new reservations created
  - `errors` (jsonb, nullable) - Array of error messages
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on both tables
  - Admins can view all logs
  - Owners can only view their own notification logs
*/

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('NEW_RESERVATION', 'INTERVENTION_SCHEDULED', 'INTERVENTION_REMINDER', 'RESERVATION_MODIFIED', 'RESERVATION_CANCELLED')),
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  intervention_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('SENT', 'FAILED', 'PENDING')),
  error text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
  properties_synced integer DEFAULT 0,
  reservations_created integer DEFAULT 0,
  errors jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies for notification_logs
CREATE POLICY "Admins can view all notification logs"
  ON notification_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Owners can view their own notification logs"
  ON notification_logs FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notification logs"
  ON notification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update notification logs"
  ON notification_logs FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for sync_logs
CREATE POLICY "Admins can view all sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert sync logs"
  ON sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update sync logs"
  ON sync_logs FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);
