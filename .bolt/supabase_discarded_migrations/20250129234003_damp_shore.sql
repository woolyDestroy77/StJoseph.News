/*
  # Database Schema Setup with Policy Management
  
  1. Tables
    - Creates tables if they don't exist
    - Adds proper relationships and constraints
  
  2. Policies
    - Safely drops existing policies before recreating
    - Adds RLS and policies for all tables
  
  3. Indexes and Settings
    - Creates performance-optimizing indexes
    - Sets up default settings
*/

-- Begin transaction
BEGIN;

-- Create tables with proper relationships
DO $$ 
BEGIN
  -- Create tables if they don't exist
  CREATE TABLE IF NOT EXISTS posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    cover_image text NOT NULL,
    published_at timestamptz DEFAULT now(),
    reading_time integer DEFAULT 5,
    educational_level text[] NOT NULL,
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    content text NOT NULL,
    author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('like', 'love', 'laugh')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id, type)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL DEFAULT 'St.Josef News',
    description text NOT NULL DEFAULT 'Latest news and updates from St.Josef International School',
    posts_per_page integer NOT NULL DEFAULT 9,
    theme text NOT NULL DEFAULT 'dark',
    social_links jsonb NOT NULL DEFAULT '{"twitter": "", "github": "", "linkedin": ""}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS banned_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
  );

EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS
DO $$ 
BEGIN
  ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
  DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
  DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
  DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
  
  DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
  DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
  DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
  DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
  
  DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON reactions;
  DROP POLICY IF EXISTS "Authenticated users can create reactions" ON reactions;
  DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;
  
  DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
  DROP POLICY IF EXISTS "Only admins can modify settings" ON settings;
  
  DROP POLICY IF EXISTS "Banned users list is viewable by admins" ON banned_users;
  DROP POLICY IF EXISTS "Only admins can manage banned users" ON banned_users;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies
DO $$ 
BEGIN
  -- Posts policies
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

  -- Comments policies
  CREATE POLICY "Comments are viewable by everyone" 
    ON comments FOR SELECT 
    USING (true);

  CREATE POLICY "Authenticated users can create comments" 
    ON comments FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = author_id);

  CREATE POLICY "Users can update their own comments" 
    ON comments FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

  CREATE POLICY "Users can delete their own comments" 
    ON comments FOR DELETE 
    TO authenticated 
    USING (auth.uid() = author_id);

  -- Reactions policies
  CREATE POLICY "Reactions are viewable by everyone" 
    ON reactions FOR SELECT 
    USING (true);

  CREATE POLICY "Authenticated users can create reactions" 
    ON reactions FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own reactions" 
    ON reactions FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

  -- Settings policies
  CREATE POLICY "Settings are viewable by everyone" 
    ON settings FOR SELECT 
    USING (true);

  CREATE POLICY "Only admins can modify settings" 
    ON settings FOR ALL 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'ADMIN'
      )
    );

  -- Banned users policies
  CREATE POLICY "Banned users list is viewable by admins" 
    ON banned_users FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'ADMIN'
      )
    );

  CREATE POLICY "Only admins can manage banned users" 
    ON banned_users FOR ALL 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'ADMIN'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Create indexes
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
  CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
  CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
  CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
  CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
  CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Insert default settings
INSERT INTO settings (
  title, 
  description, 
  posts_per_page, 
  theme, 
  social_links
) VALUES (
  'St.Josef News',
  'Latest news and updates from St.Josef International School',
  9,
  'dark',
  '{"twitter": "", "github": "", "linkedin": ""}'
) ON CONFLICT DO NOTHING;

COMMIT;