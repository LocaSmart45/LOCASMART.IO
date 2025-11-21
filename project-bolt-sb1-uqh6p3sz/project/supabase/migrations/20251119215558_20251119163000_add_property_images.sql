/*
  # Add Property Images Support

  1. Changes
    - Add `image_url` column to `properties` table to store uploaded property images

  2. Notes
    - Storage bucket creation will be handled separately
*/

-- Add image_url column to properties table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE properties ADD COLUMN image_url text;
  END IF;
END $$;