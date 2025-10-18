const asyncHandler = require('../../utils/asyncHandler');
const { requestPasswordReset } = require('../../services/passwordResetService');

module.exports = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const { token, expires_at, user } = await requestPasswordReset(email);

  res.json({
    message: 'Password reset token generated. Provide this token along with a new password to complete the reset.',
    resetToken: token,
    expires_at,
    user
  });
});

