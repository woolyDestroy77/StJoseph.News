import initSqlJs from 'sql.js';

let db: any = null;

export const initDb = async () => {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });

  db = new SQL.Database();

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      published_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reading_time INTEGER DEFAULT 5,
      educational_level TEXT NOT NULL,
      author_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('like', 'love', 'laugh')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id, type),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      posts_per_page INTEGER NOT NULL,
      theme TEXT NOT NULL,
      social_links TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banned_users (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      banned_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (banned_by) REFERENCES users(id)
    );
  `);

  // Create indexes
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
    CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
  `);

  // Insert default settings
  db.run(`
    INSERT OR IGNORE INTO settings (
      id, 
      title, 
      description, 
      posts_per_page, 
      theme, 
      social_links
    ) VALUES (
      'default',
      'St.Josef News',
      'Latest news and updates from St.Josef International School',
      9,
      'dark',
      '{"twitter": "", "github": "", "linkedin": ""}'
    );
  `);

  return db;
};

export const getDb = async () => {
  if (!db) {
    db = await initDb();
  }
  return db;
};

export const saveDb = () => {
  if (!db) return null;
  return db.export();
};