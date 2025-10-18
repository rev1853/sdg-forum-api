const asyncHandler = require('../../utils/asyncHandler');
const { listCategories } = require('../../services/categoryService');

module.exports = asyncHandler(async (_req, res) => {
  const categories = await listCategories();
  res.json({ categories });
});

