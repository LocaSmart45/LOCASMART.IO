/*
  # Add check-in and check-out times to reservations

  1. Changes
    - Add `check_in_time` column (text) to store arrival time (format: HH:MM)
    - Add `check_out_time` column (text) to store departure time (format: HH:MM)
    - Set default values: 15:00 for check-in, 11:00 for check-out (standard hotel times)
  
  2. Notes
    - Times are stored as text in HH:MM format for simplicity
    - Default times follow standard short-term rental practices
    - Existing reservations will get default time values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'check_in_time'
  ) THEN
    ALTER TABLE reservations ADD COLUMN check_in_time text DEFAULT '15:00';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'check_out_time'
  ) THEN
    ALTER TABLE reservations ADD COLUMN check_out_time text DEFAULT '11:00';
  END IF;
END $$;