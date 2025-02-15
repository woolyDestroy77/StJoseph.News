/*
  # Initial Schema Setup

  1. Tables
    - Creates posts table with necessary columns
    - Sets up RLS policies for secure access

  2. Security
    - Enables RLS on posts table
    - Creates policies for CRUD operations
*/

-- Begin transaction
BEGIN;

-- Create posts table if it doesn't exist
DO $$ 
BEGIN
  CREATE TABLE IF NOT EXISTS posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    excerpt text NOT NULL,
    cover_image text NOT NULL,
    published_at timestamptz DEFAULT now(),
    reading_time integer DEFAULT 5,
    featured boolean DEFAULT false,
    author_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
  DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
  DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
  DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies
CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create posts" 
  ON posts FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" 
  ON posts FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" 
  ON posts FOR DELETE 
  TO authenticated 
  USING (auth.uid() = author_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);

COMMIT;