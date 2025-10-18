const asyncHandler = require('../../utils/asyncHandler');
const { getThreadById } = require('../../services/threadService');
const { createComment } = require('../../services/commentService');

module.exports = asyncHandler(async (req, res) => {
  const thread = await getThreadById(req.params.threadId);
  const comment = await createComment(thread, req.user.id, {
    body: req.body?.body
  });

  res.status(201).json({ comment });
});

