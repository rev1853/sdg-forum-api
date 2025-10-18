const asyncHandler = require('../../utils/asyncHandler');
const { getForumBySlug } = require('../../services/forumService');
const { createThread } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  const forum = await getForumBySlug(req.params.slug);

  const thread = await createThread(forum, req.user.id, {
    body: req.body?.body,
    mediaPath: req.uploadedMediaPath || null
  });

  res.status(201).json({ thread });
});

