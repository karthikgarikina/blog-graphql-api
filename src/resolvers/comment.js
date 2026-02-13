export const Comment = {
  async author(parent, _, context) {
    return context.loaders.userLoader.load(parent.author_id);
  }
};
