import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Initialize the database
const db = new Database('public/blog.db');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create the tables
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    published_at TEXT NOT NULL,
    reading_time INTEGER DEFAULT 5,
    educational_level TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'love', 'laugh')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id, type)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    post TEXT NOT NULL,
    user TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    posts_per_page INTEGER NOT NULL,
    default_author_name TEXT NOT NULL,
    default_author_email TEXT NOT NULL,
    theme TEXT NOT NULL,
    social_links TEXT NOT NULL
  );
`);

// Create indexes for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
  CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
  CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
  CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity(timestamp);
`);

// Insert default settings if they don't exist
const defaultSettings = {
  id: 'default',
  title: 'St.Josef News',
  description: 'Latest news and updates from St.Josef International School',
  posts_per_page: 9,
  default_author_name: 'Admin',
  default_author_email: 'admin@stjosefschool.com',
  theme: 'dark',
  social_links: JSON.stringify({
    twitter: '',
    github: '',
    linkedin: ''
  })
};

db.prepare(`
  INSERT OR IGNORE INTO settings 
  (id, title, description, posts_per_page, default_author_name, default_author_email, theme, social_links)
  VALUES (@id, @title, @description, @posts_per_page, @default_author_name, @default_author_email, @theme, @social_links)
`).run(defaultSettings);

// Close the database
db.close();

console.log('Database initialized successfully!');