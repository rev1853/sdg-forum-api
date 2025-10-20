const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { authenticateWithGoogle } = require('../../services/auth/googleAuthService');

module.exports = asyncHandler(async (req, res) => {
  const { idToken } = req.body || {};

  if (!idToken) {
    throw new ApiError(400, 'idToken is required');
  }

  const result = await authenticateWithGoogle(idToken);
  res.json(result);
});
