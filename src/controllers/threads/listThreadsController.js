const asyncHandler = require('../../utils/asyncHandler');
const parseList = require('../../utils/parseList');
const { listThreads } = require('../../services/threadService');

module.exports = asyncHandler(async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = Number.parseInt(req.query.pageSize, 10) || 10;
  const tags = parseList(req.query.tags, { fieldName: 'tags' }).map((tag) =>
    tag.toLowerCase()
  );
  const categoryIds = parseList(req.query.categories, { fieldName: 'categories' });
  const search = req.query.search ? req.query.search.toString().trim() : undefined;

  const result = await listThreads({
    page,
    pageSize,
    tags,
    categoryIds,
    search
  });

  res.json(result);
});
