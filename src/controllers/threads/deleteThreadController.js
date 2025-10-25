const asyncHandler = require('../../utils/asyncHandler');
const { removeThread } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  await removeThread(req.params.threadId, req.user.id);
  res.status(204).send();
});
