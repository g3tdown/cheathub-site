-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Topics
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author_id INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(author_id) REFERENCES users(id)
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL,
  author_id INTEGER,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(topic_id) REFERENCES topics(id),
  FOREIGN KEY(author_id) REFERENCES users(id)
);
