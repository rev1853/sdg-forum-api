const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');

const normalizeEmail = (value) => value.trim().toLowerCase();

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const generateToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const requestPasswordReset = async (email) => {
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, username: true, name: true }
  });

  if (!user) {
    throw new ApiError(404, 'User with this email was not found');
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    }
  });

  return {
    token,
    expires_at: expiresAt,
    user
  };
};

const resetPassword = async ({ token, password }) => {
  if (!token || !password) {
    throw new ApiError(400, 'Token and password are required');
  }

  const hashedToken = hashToken(token);
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token_hash: hashedToken },
    include: { user: true }
  });

  if (
    !tokenRecord ||
    tokenRecord.used_at ||
    tokenRecord.expires_at < new Date()
  ) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.user_id },
      data: { password_hash: passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used_at: new Date() }
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        user_id: tokenRecord.user_id,
        used_at: null,
        id: { not: tokenRecord.id }
      },
      data: { used_at: new Date() }
    })
  ]);
};

module.exports = {
  requestPasswordReset,
  resetPassword
};
