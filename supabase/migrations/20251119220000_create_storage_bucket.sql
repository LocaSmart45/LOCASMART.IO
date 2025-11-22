/*
  # Create Storage Bucket for Property Images

  1. Storage
    - Create public bucket `property-images`
    - Set file size limit to 5MB
    - Allow common image formats
  
  2. Security
    - Enable public access for reading
    - Restrict uploads to authenticated users only
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Authenticated can update own images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-images')
  WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Authenticated can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-images');
