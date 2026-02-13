import { withFilter } from 'graphql-subscriptions';

export const Subscription = {
  postCreated: {
    subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['POST_CREATED'])
  },
  commentAdded: {
    subscribe: withFilter(
      (_, __, { pubsub }) => pubsub.asyncIterator(['COMMENT_ADDED']),
      (payload, variables) => payload.postId === parseInt(variables.postId, 10)
    )
  }
};
