const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { getThreadForModeration, updateThreadStatus } = require('../../services/threadService');
const { isForumModerator } = require('../../services/forumService');

module.exports = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const thread = await getThreadForModeration(req.params.threadId);

  const isOwner = thread.forum.owner_id === req.user.id;
  const isModerator = await isForumModerator(thread.forum.id, req.user.id);

  if (!isOwner && !isModerator) {
    throw new ApiError(403, 'Only forum owner or moderator can update thread status');
  }

  const updated = await updateThreadStatus(thread.id, status || 'REMOVED');

  res.json({ thread: updated });
});

