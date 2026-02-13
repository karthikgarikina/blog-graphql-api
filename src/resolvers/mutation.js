import {
  createPost,
  deletePostById,
  findPostById,
  updatePostById
} from '../services/post.service.js';
import { createComment } from '../services/comment.service.js';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} from '../utils/errors.js';
import { findUserByUsername } from '../services/user.service.js';
import { generateToken } from '../auth/jwt.js';


export const Mutation = {
  async createPost(_, { input }, context) {
    if (!context.user) throw new AuthenticationError();
    const post = await createPost(input, context.user.sub);

    if (context.pubsub) {
      await context.pubsub.publish('POST_CREATED', { postCreated: post });
    }

    return post;
  },

  async updatePost(_, { id, input }, context) {
    if (!context.user) throw new AuthenticationError();

    const post = await findPostById(id);
    if (!post) throw new NotFoundError('Post not found');

    if (post.author_id !== context.user.sub) {
      throw new AuthorizationError();
    }

    const updated = await updatePostById(id, input);
    if (!updated) throw new NotFoundError('Post not found');

    return updated;
  },

  async deletePost(_, { id }, context) {
    if (!context.user) throw new AuthenticationError();

    const post = await findPostById(id);
    if (!post) throw new NotFoundError('Post not found');

    if (post.author_id !== context.user.sub)
      throw new AuthorizationError();

    await deletePostById(id);
    return true;
  },

  async createComment(_, { input }, context) {
    if (!context.user) throw new AuthenticationError();
    
    // Check if post exists
    const post = await findPostById(input.postId);
    if (!post) throw new NotFoundError('Post not found');
    
    const comment = await createComment(input, context.user.sub);

    if (context.pubsub) {
      await context.pubsub.publish('COMMENT_ADDED', {
        commentAdded: comment,
        postId: comment.post_id
      });
    }

    return comment;
  },

  async login(_, { username }) {
    const user = await findUserByUsername(username);

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const token = generateToken(user);

    return {
      token,
      user
    };
  }

};
