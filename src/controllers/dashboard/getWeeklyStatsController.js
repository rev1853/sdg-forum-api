const asyncHandler = require('../../utils/asyncHandler');
const { getWeeklyThreadStats } = require('../../services/dashboardService');

module.exports = asyncHandler(async (_req, res) => {
  const stats = await getWeeklyThreadStats();
  res.json({ stats });
});
