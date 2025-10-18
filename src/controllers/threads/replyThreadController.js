const asyncHandler = require('../../utils/asyncHandler');
const parseList = require('../../utils/parseList');
const { createThread } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  const { title, body, tags, categoryIds } = req.body || {};

  const thread = await createThread({
    authorId: req.user.id,
    title,
    body,
    tags,
    categoryIds: parseList(categoryIds, { fieldName: 'categoryIds' }),
    imagePath: req.uploadedMediaPath || null,
    parentThreadId: req.params.threadId
  });

  res.status(201).json({ thread });
});

