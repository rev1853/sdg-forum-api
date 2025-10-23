const asyncHandler = require('../../utils/asyncHandler');
const { leaveGroup } = require('../../services/chatGroupService');

module.exports = asyncHandler(async (req, res) => {
  await leaveGroup(req.params.groupId, req.user.id);
  res.status(204).send();
});
