const asyncHandler = require('../../utils/asyncHandler');
const { getForumBySlug, unfollowForum } = require('../../services/forumService');

module.exports = asyncHandler(async (req, res) => {
  const forum = await getForumBySlug(req.params.slug);
  await unfollowForum(forum, req.user.id);

  res.status(204).send();
});

