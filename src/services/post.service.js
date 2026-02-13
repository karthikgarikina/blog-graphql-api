import { pool } from '../db/pool.js';

export async function findPostById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM posts WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function findPostsPage({ first = 10, afterId = 0, published }) {
  const limit = Math.min(first, 50);

  const values = [afterId, limit + 1];
  let filterSql = '';

  if (published !== undefined && published !== null) {
    values.push(published);
    filterSql = 'AND published = $3';
  }

  const { rows } = await pool.query(
    `SELECT * FROM posts
     WHERE id > $1 ${filterSql}
     ORDER BY id ASC
     LIMIT $2`,
    values
  );

  const hasNextPage = rows.length > limit;
  return {
    nodes: hasNextPage ? rows.slice(0, limit) : rows,
    hasNextPage
  };
}

export async function findPostsByAuthorPage({ authorId, first = 10, afterId = 0 }) {
  const limit = Math.min(first, 50);

  const { rows } = await pool.query(
    `SELECT * FROM posts
     WHERE author_id = $1 AND id > $2
     ORDER BY id ASC
     LIMIT $3`,
    [authorId, afterId, limit + 1]
  );

  const hasNextPage = rows.length > limit;
  return {
    nodes: hasNextPage ? rows.slice(0, limit) : rows,
    hasNextPage
  };
}

export async function createPost(data, userId) {
  const { title, content, published = false } = data;

  const { rows } = await pool.query(
    `INSERT INTO posts (title, content, author_id, published)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, content, userId, published]
  );

  return rows[0];
}

export async function updatePostById(id, data) {
  const { title, content, published } = data;

  const { rows } = await pool.query(
    `UPDATE posts
     SET title = COALESCE($2, title),
         content = COALESCE($3, content),
         published = COALESCE($4, published),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, title ?? null, content ?? null, published ?? null]
  );

  return rows[0] || null;
}

export async function deletePostById(id) {
  await pool.query(
    'DELETE FROM posts WHERE id = $1',
    [id]
  );
}
