/*
  # Database Schema Setup
  
  1. Tables
    - Creates tables if they don't exist
    - Adds proper relationships and constraints
    - Handles existing tables gracefully
  
  2. Indexes
    - Creates performance-optimizing indexes
*/

-- Begin transaction
BEGIN;

-- Create tables with IF NOT EXISTS
DO $$ 
BEGIN
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Posts table
  CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    reading_time INTEGER DEFAULT 5,
    educational_level TEXT[] NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Reactions table
  CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'love', 'laugh')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id, type)
  );

  -- Comments table
  CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_published_at') THEN
    CREATE INDEX idx_posts_published_at ON posts(published_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reactions_post_id') THEN
    CREATE INDEX idx_reactions_post_id ON reactions(post_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comments_post_id') THEN
    CREATE INDEX idx_comments_post_id ON comments(post_id);
  END IF;
END $$;

COMMIT;