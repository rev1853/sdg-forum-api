const asyncHandler = require('../../utils/asyncHandler');
const { createGroup } = require('../../services/chatGroupService');

module.exports = asyncHandler(async (req, res) => {
  const { name, categoryIds } = req.body || {};

  const group = await createGroup(req.user.id, {
    name,
    categoryIds: Array.isArray(categoryIds) ? categoryIds : []
  });

  res.status(201).json({ group });
});
