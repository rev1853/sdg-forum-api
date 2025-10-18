const asyncHandler = require('../../utils/asyncHandler');
const { getForumBySlug, softDeleteForum } = require('../../services/forumService');

module.exports = asyncHandler(async (req, res) => {
  const forum = await getForumBySlug(req.params.slug, { includeRemoved: true });

  await softDeleteForum(forum, req.user.id);

  res.status(204).send();
});

