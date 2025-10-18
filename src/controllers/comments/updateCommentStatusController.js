const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { getCommentForModeration, updateCommentStatus } = require('../../services/commentService');
const { isForumModerator } = require('../../services/forumService');

module.exports = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const comment = await getCommentForModeration(req.params.commentId);

  const isOwner = comment.post.forum.owner_id === req.user.id;
  const isModerator = await isForumModerator(comment.post.forum.id, req.user.id);

  if (!isOwner && !isModerator) {
    throw new ApiError(403, 'Only forum owner or moderator can update comment status');
  }

  const updated = await updateCommentStatus(comment.id, status || 'REMOVED');

  res.json({ comment: updated });
});

