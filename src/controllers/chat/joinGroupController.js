const asyncHandler = require('../../utils/asyncHandler');
const { joinGroup } = require('../../services/chatGroupService');

module.exports = asyncHandler(async (req, res) => {
  await joinGroup(req.params.groupId, req.user.id);
  res.status(204).send();
});
