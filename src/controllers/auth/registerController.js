const asyncHandler = require('../../utils/asyncHandler');
const { registerUser } = require('../../services/authService');
const { signToken } = require('../../services/jwtService');

module.exports = asyncHandler(async (req, res) => {
  const { email, username, password, name } = req.body || {};

  const user = await registerUser({ email, username, password, name });
  const token = signToken({ sub: user.id, username: user.username });

  res.status(201).json({
    user,
    token
  });
});
