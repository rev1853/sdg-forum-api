const asyncHandler = require('../../utils/asyncHandler');
const { repostThread } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  const interaction = await repostThread(req.params.threadId, req.user.id);
  res.status(201).json({ interaction });
});

