const asyncHandler = require('../../utils/asyncHandler');
const { unlikeThread } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  await unlikeThread(req.params.threadId, req.user.id);
  res.status(204).send();
});

