const asyncHandler = require('../../utils/asyncHandler');
const { getGroupById } = require('../../services/chatGroupService');

module.exports = asyncHandler(async (req, res) => {
  const group = await getGroupById(req.params.groupId);
  res.json({ group });
});
