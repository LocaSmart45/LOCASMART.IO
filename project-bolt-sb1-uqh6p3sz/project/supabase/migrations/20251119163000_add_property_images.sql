/*
  # Add Property Images Support

  1. Changes
    - Add `image_url` column to `properties` table to store uploaded property images
    - Create storage bucket `property-images` for storing property photos
    - Set up RLS policies for the storage bucket

  2. Security
    - Authenticated users can upload images
    - Anyone can view images (public access for property photos)
    - Only admins can delete images
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

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Allow authenticated users to update their uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can update property images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images');

-- Allow anyone to view property images (public bucket)
CREATE POLICY IF NOT EXISTS "Anyone can view property images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Only admins can delete images
CREATE POLICY IF NOT EXISTS "Admins can delete property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
);
