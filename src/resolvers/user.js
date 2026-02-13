import { GraphQLError } from 'graphql';
import { createConnection, decodeCursor } from '../utils/pagination.js';
import { findPostsByAuthorPage } from '../services/post.service.js';

export const User = {
  email(parent, _, context) {
    if (!context.user) {
      throw new GraphQLError('Authentication required');
    }

    const userId = Number(context.user.sub);
    const isOwner = userId === Number(parent.id);
    const isAdmin = context.user.role === 'admin';

    if (isOwner || isAdmin) {
      return parent.email;
    }

    throw new GraphQLError('Not authorized to access email');
  },

  async posts(parent, { first = 10, after }) {
    const afterId = after ? decodeCursor(after) : 0;
    const { nodes, hasNextPage } = await findPostsByAuthorPage({
      authorId: parent.id,
      first,
      afterId
    });

    return createConnection(nodes, hasNextPage);
  }
};
