const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../services/jwtService');

const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization header missing');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const decoded = verifyToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: { id: true, email: true, username: true }
  });

  if (!user) {
    throw new ApiError(401, 'User not found for token');
  }

  req.user = user;
  next();
});

module.exports = authenticate;

