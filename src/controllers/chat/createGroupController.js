const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

module.exports = asyncHandler(async (_req, _res) => {
  throw new ApiError(410, 'Chat groups are fixed to SDG categories and cannot be created');
});
