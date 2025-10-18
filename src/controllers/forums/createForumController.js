const asyncHandler = require('../../utils/asyncHandler');
const { createForum } = require('../../services/forumService');

module.exports = asyncHandler(async (req, res) => {
  const { title, description, categoryIds } = req.body || {};
  const forum = await createForum(req.user.id, {
    title,
    description,
    categoryIds: Array.isArray(categoryIds) ? categoryIds : []
  });

  res.status(201).json({
    forum: {
      id: forum.id,
      slug: forum.slug,
      title: forum.title,
      description: forum.description,
      owner: forum.owner,
      categories: forum.categories.map((item) => item.category),
      created_at: forum.created_at
    }
  });
});

