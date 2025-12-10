const asyncHandler = require('../../utils/asyncHandler');
const parseList = require('../../utils/parseList');
const { updateThread } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    const { title, body, categoryIds, tags } = req.body || {};

    const updatedThread = await updateThread(threadId, req.user.id, {
        title,
        body,
        categoryIds: categoryIds ? parseList(categoryIds, { fieldName: 'categoryIds' }) : undefined,
        tags,
        imagePath: req.uploadedMediaPath
    });

    res.status(200).json({ thread: updatedThread });
});
