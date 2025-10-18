const asyncHandler = require('../../utils/asyncHandler');
const { resetPassword } = require('../../services/passwordResetService');

module.exports = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  await resetPassword({ token, password });

  res.json({
    message: 'Password has been reset successfully'
  });
});

