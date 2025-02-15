-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage tables if they don't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Enable Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS objects_path_tokens_idx ON storage.objects USING GIN (path_tokens);
CREATE INDEX IF NOT EXISTS objects_bucket_id_idx ON storage.objects (bucket_id);