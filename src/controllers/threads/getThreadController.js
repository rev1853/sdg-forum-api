const asyncHandler = require('../../utils/asyncHandler');
const { getThreadById } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  const thread = await getThreadById(req.params.threadId);
  res.json({ thread });
});

