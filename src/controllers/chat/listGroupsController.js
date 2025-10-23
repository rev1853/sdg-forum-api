const asyncHandler = require('../../utils/asyncHandler');
const { listGroups } = require('../../services/chatGroupService');

module.exports = asyncHandler(async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = Number.parseInt(req.query.pageSize, 10) || 20;

  const result = await listGroups({ page, pageSize });
  res.json(result);
});
