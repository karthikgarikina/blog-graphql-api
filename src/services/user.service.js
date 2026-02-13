import { pool } from '../db/pool.js';

export async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function findUserByUsername(username) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return rows[0] || null;
}

export async function findUsersPage({ first = 10, afterId = 0 }) {
  const limit = Math.min(first, 50);
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id > $1 ORDER BY id ASC LIMIT $2',
    [afterId, limit + 1]
  );

  const hasNextPage = rows.length > limit;
  return {
    nodes: hasNextPage ? rows.slice(0, limit) : rows,
    hasNextPage
  };
}
