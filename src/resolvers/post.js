import { createConnection, decodeCursor } from '../utils/pagination.js';

export const Post = {
  async author(parent, _, context) {
    return context.loaders.userLoader.load(parent.author_id);
  },

  async comments(parent, { first = 10, after }, context) {
    const allComments = await context.loaders.commentsByPostIdLoader.load(
      parent.id
    );

    const afterId = after ? decodeCursor(after) : 0;
    const filtered = allComments.filter(comment => comment.id > afterId);
    const limit = Math.min(first, 50);
    const sliced = filtered.slice(0, limit);
    const hasNextPage = filtered.length > limit;

    return createConnection(sliced, hasNextPage);
  }
};
