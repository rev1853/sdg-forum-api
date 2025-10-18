const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

const getExpiry = () => process.env.JWT_EXPIRES_IN || '12h';

const signToken = (payload) => {
  return jwt.sign(payload, getSecret(), { expiresIn: getExpiry() });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

module.exports = {
  signToken,
  verifyToken
};

