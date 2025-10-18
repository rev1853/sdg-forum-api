const asyncHandler = require('../../utils/asyncHandler');
const { getForumBySlug, setModeratorStatus } = require('../../services/forumService');
const ApiError = require('../../utils/ApiError');

module.exports = asyncHandler(async (req, res) => {
  const forum = await getForumBySlug(req.params.slug);
  const { userId } = req.params;
  const { isModerator } = req.body || {};

  if (userId === req.user.id) {
    throw new ApiError(400, 'Owner is implicitly a moderator');
  }

  const relation = await setModeratorStatus(forum, userId, Boolean(isModerator), req.user.id);

  res.json({
    follower: {
      forum_id: relation.forum_id,
      user_id: relation.user_id,
      is_moderator: relation.is_moderator
    }
  });
});

