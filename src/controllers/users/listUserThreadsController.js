const asyncHandler = require('../../utils/asyncHandler');
const { listUserThreads } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = Number.parseInt(req.query.pageSize, 10) || 10;

  const result = await listUserThreads(req.params.userId, { page, pageSize });

  res.json(result);
});

