/*
  # Blog Schema Setup

  1. New Tables
    - `posts`
      - Core blog post data
      - Includes title, content, cover image, etc.
    - `reactions`
      - User reactions to posts (like, love, laugh)
    - `comments`
      - User comments on posts
    - `settings`
      - Blog configuration settings
    - `activity_log`
      - Audit trail of user actions

  2. Security
    - RLS enabled on all tables
    - Public read access for posts and comments
    - Authenticated write access for reactions and comments
    - Admin-only access for settings
*/

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  cover_image text NOT NULL,
  published_at timestamptz DEFAULT now(),
  reading_time integer DEFAULT 5,
  educational_level text[] NOT NULL,
  author_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reactions Table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('like', 'love', 'laugh')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, type)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  posts_per_page integer NOT NULL DEFAULT 9,
  theme text NOT NULL DEFAULT 'dark',
  social_links jsonb NOT NULL DEFAULT '{"twitter": "", "github": "", "linkedin": ""}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Posts Policies
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Reactions Policies
CREATE POLICY "Reactions are viewable by everyone" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add reactions" ON reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" ON reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Settings Policies
CREATE POLICY "Settings are viewable by everyone" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify settings" ON settings
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'ADMIN'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'ADMIN'
  ));

-- Activity Log Policies
CREATE POLICY "Activity log is viewable by admins" ON activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'ADMIN'
  ));

CREATE POLICY "System can create activity logs" ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at);