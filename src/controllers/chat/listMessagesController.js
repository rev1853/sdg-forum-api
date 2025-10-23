const asyncHandler = require('../../utils/asyncHandler');
const { listMessages } = require('../../services/chatMessageService');

module.exports = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { after, limit } = req.query;

  const messages = await listMessages(groupId, req.user.id, {
    after: after ? after.toString() : undefined,
    limit: limit ? Number.parseInt(limit, 10) : undefined
  });

  res.json({ messages });
});
