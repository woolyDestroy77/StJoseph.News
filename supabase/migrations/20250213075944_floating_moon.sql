-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Update images bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'images';

-- Set up storage policies with broader permissions
CREATE POLICY "Give users access to own folder"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;