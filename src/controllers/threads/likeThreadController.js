const asyncHandler = require('../../utils/asyncHandler');
const { likeThread } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  const interaction = await likeThread(req.params.threadId, req.user.id);
  res.status(201).json({ interaction });
});

