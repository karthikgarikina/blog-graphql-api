import DataLoader from 'dataloader';
import { pool } from '../db/pool.js';

async function batchUsersById(userIds) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = ANY($1)',
    [userIds]
  );
  const byId = new Map(rows.map(user => [user.id, user]));
  return userIds.map(id => byId.get(id) || null);
}

async function batchCommentsByPostId(postIds) {
  const { rows } = await pool.query(
    'SELECT * FROM comments WHERE post_id = ANY($1) ORDER BY post_id ASC, id ASC',
    [postIds]
  );

  const grouped = new Map();
  for (const postId of postIds) {
    grouped.set(postId, []);
  }

  for (const comment of rows) {
    if (!grouped.has(comment.post_id)) {
      grouped.set(comment.post_id, []);
    }
    grouped.get(comment.post_id).push(comment);
  }

  return postIds.map(postId => grouped.get(postId) || []);
}

export function createLoaders() {
  return {
    userLoader: new DataLoader(batchUsersById),
    commentsByPostIdLoader: new DataLoader(batchCommentsByPostId)
  };
}
