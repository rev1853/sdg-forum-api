const asyncHandler = require('../../utils/asyncHandler');
const { createReport } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  const { reasonCode, message } = req.body || {};
  const report = await createReport(req.params.threadId, req.user.id, {
    reasonCode,
    message
  });

  res.status(201).json({ report });
});

