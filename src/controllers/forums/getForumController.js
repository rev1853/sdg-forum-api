const asyncHandler = require('../../utils/asyncHandler');
const { getForumBySlug } = require('../../services/forumService');

module.exports = asyncHandler(async (req, res) => {
  const forum = await getForumBySlug(req.params.slug);

  res.json({
    forum: {
      id: forum.id,
      slug: forum.slug,
      title: forum.title,
      description: forum.description,
      status: forum.status,
      owner: forum.owner,
      categories: forum.categories.map((item) => item.category),
      counts: forum._count
    }
  });
});

