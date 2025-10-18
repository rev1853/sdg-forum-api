const asyncHandler = require('../../utils/asyncHandler');
const { unrepostThread } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  await unrepostThread(req.params.threadId, req.user.id);
  res.status(204).send();
});

