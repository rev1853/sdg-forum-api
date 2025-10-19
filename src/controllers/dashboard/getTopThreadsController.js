const asyncHandler = require('../../utils/asyncHandler');
const { getTopThreadsByInteraction } = require('../../services/dashboardService');

module.exports = asyncHandler(async (_req, res) => {
  const data = await getTopThreadsByInteraction();
  res.json(data);
});
