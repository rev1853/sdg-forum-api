const asyncHandler = require('../../utils/asyncHandler');
const prisma = require('../../prisma');
const ApiError = require('../../utils/ApiError');

const normalizeEmail = (value) => value.trim().toLowerCase();
const normalizeUsername = (value) => value.trim().toLowerCase();

module.exports = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const authenticatedId = req.user?.id;

  if (!authenticatedId || authenticatedId !== userId) {
    throw new ApiError(403, 'You are not allowed to update this user');
  }

  const { email, username, name, profilePicture, removeProfilePicture } = req.body || {};
  const uploadedProfilePicture = req.uploadedMediaPath || null;

  const data = {};

  if (email !== undefined) {
    if (!email || typeof email !== 'string') {
      throw new ApiError(400, 'Email must be a non-empty string');
    }
    data.email = normalizeEmail(email);
  }

  if (username !== undefined) {
    if (!username || typeof username !== 'string') {
      throw new ApiError(400, 'Username must be a non-empty string');
    }
    data.username = normalizeUsername(username);
  }

  if (name !== undefined) {
    data.name = name ? name.toString().trim() : null;
  }

  if (uploadedProfilePicture) {
    data.profile_picture = uploadedProfilePicture;
  } else if (removeProfilePicture !== undefined) {
    const shouldRemove = ['true', '1', true, 1].includes(removeProfilePicture);
    if (shouldRemove) {
      data.profile_picture = null;
    }
  } else if (profilePicture !== undefined) {
    data.profile_picture = profilePicture ? profilePicture.toString().trim() : null;
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, 'No updatable fields provided');
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
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

    res.json({ user });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new ApiError(409, 'Email or username already in use');
    }

    throw error;
  }
});
