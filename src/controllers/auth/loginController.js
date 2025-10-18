const asyncHandler = require('../../utils/asyncHandler');
const { loginUser } = require('../../services/authService');
const { signToken } = require('../../services/jwtService');

module.exports = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body || {};

  const user = await loginUser({ identifier, password });
  const token = signToken({ sub: user.id, username: user.username });

  res.json({
    user,
    token
  });
});

