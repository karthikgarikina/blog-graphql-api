-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POSTS
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- COMMENTS
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEED USERS
INSERT INTO users (username, email, password_hash, role)
VALUES
('user1', 'user1@test.com', 'hash1', 'user'),
('user2', 'user2@test.com', 'hash2', 'user'),
('admin', 'admin@test.com', 'hash3', 'admin');

-- SEED POSTS
INSERT INTO posts (title, content, author_id, published)
VALUES
('Post 1', 'Content 1', 1, true),
('Post 2', 'Content 2', 1, true),
('Post 3', 'Content 3', 2, false);

-- SEED COMMENTS
INSERT INTO comments (content, author_id, post_id)
VALUES
('Nice post!', 2, 1),
('Great!', 1, 1),
('Interesting', 1, 2);
