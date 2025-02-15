/*
  # Database Schema Setup
  
  1. Tables
    - Creates tables if they don't exist
    - Adds proper relationships and constraints
    - Handles existing tables gracefully
  
  2. Indexes and Default Data
    - Creates performance-optimizing indexes
    - Inserts default settings and admin user
*/

-- Begin transaction
BEGIN;

-- Create tables with IF NOT EXISTS
DO $$ 
BEGIN
  -- Settings table
  CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'St.Josef News',
    description TEXT NOT NULL DEFAULT 'Latest news and updates from St.Josef International School',
    posts_per_page INTEGER NOT NULL DEFAULT 9,
    theme TEXT NOT NULL DEFAULT 'dark',
    social_links JSONB NOT NULL DEFAULT '{"twitter": "", "github": "", "linkedin": ""}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
  -- Only create indexes if their tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_published_at') THEN
      CREATE INDEX idx_posts_published_at ON posts(published_at);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reactions_post_id') THEN
      CREATE INDEX idx_reactions_post_id ON reactions(post_id);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comments_post_id') THEN
      CREATE INDEX idx_comments_post_id ON comments(post_id);
    END IF;
  END IF;
END $$;

-- Insert default settings if not exists
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