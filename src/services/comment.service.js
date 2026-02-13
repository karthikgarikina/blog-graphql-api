import { pool } from '../db/pool.js';

export async function createComment(data, userId) {
  const { postId, content } = data;

  const { rows } = await pool.query(
    `INSERT INTO comments (content, author_id, post_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [content, userId, postId]
  );

  return rows[0];
}
