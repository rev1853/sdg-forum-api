const asyncHandler = require('../../utils/asyncHandler');
const { getForumBySlug, followForum } = require('../../services/forumService');

module.exports = asyncHandler(async (req, res) => {
  const forum = await getForumBySlug(req.params.slug);
  const relation = await followForum(forum, req.user.id);

  res.status(201).json({
    follower: {
      forum_id: relation.forum_id,
      user_id: relation.user_id,
      is_moderator: relation.is_moderator,
      followed_at: relation.followed_at
    }
  });
});

