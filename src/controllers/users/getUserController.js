const asyncHandler = require('../../utils/asyncHandler');
const prisma = require('../../prisma');
const ApiError = require('../../utils/ApiError');

module.exports = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      profile_picture: true,
      created_at: true,
      _count: {
        select: {
          threads: true,
          interactions: true,
          reportsFiled: true
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ user });
});

