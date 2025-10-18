const asyncHandler = require('../../utils/asyncHandler');
const { getForumBySlug } = require('../../services/forumService');
const { listForumThreads } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = Number.parseInt(req.query.pageSize, 10) || 10;

  const forum = await getForumBySlug(req.params.slug);
  const threads = await listForumThreads(forum.id, { page, pageSize });

  res.json({
    forum: {
      id: forum.id,
      slug: forum.slug,
      title: forum.title
    },
    threads
  });
});

