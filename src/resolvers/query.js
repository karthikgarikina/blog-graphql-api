import { findUserById, findUsersPage } from '../services/user.service.js';
import { findPostById, findPostsPage } from '../services/post.service.js';
import { AuthenticationError } from '../utils/errors.js';
import { createConnection, decodeCursor } from '../utils/pagination.js';

export const Query = {
  async user(_, { id }) {
    return findUserById(id);
  },

  async users(_, { first = 10, after }) {
    const afterId = after ? decodeCursor(after) : 0;
    const { nodes, hasNextPage } = await findUsersPage({ first, afterId });
    return createConnection(nodes, hasNextPage);
  },

  async post(_, { id }) {
    return findPostById(id);
  },

  async posts(_, { first = 10, after, published }) {
    const afterId = after ? decodeCursor(after) : 0;
    const { nodes, hasNextPage } = await findPostsPage({
      first,
      afterId,
      published
    });
    return createConnection(nodes, hasNextPage);
  },

  async me(_, __, context) {
    if (!context.user) throw new AuthenticationError();
    return findUserById(context.user.sub);
  }
};
