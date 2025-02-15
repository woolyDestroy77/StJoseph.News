-- Enable Storage
INSERT INTO storage.buckets (id, name)
VALUES ('images', 'images')
ON CONFLICT DO NOTHING;

-- Set up storage policies
CREATE POLICY "Images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'images' );

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'images' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'images' AND auth.uid() = owner );