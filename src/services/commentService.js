const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');

const createComment = async (thread, userId, { body }) => {
  if (!body) {
    throw new ApiError(400, 'Comment body is required');
  }

  const comment = await prisma.comment.create({
    data: {
      body: body.trim(),
      post_id: thread.id,
      user_id: userId
    },
    include: {
      user: { select: { id: true, username: true } }
    }
  });

  return comment;
};

const getCommentForModeration = async (commentId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      post: {
        include: {
          forum: true
        }
      },
      user: { select: { id: true, username: true } }
    }
  });

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  return comment;
};

const updateCommentStatus = async (commentId, status) => {
  if (!['ACTIVE', 'REMOVED'].includes(status)) {
    throw new ApiError(400, 'Invalid comment status');
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { status },
    include: {
      post: {
        include: {
          forum: true
        }
      },
      user: { select: { id: true, username: true } }
    }
  });

  return comment;
};

module.exports = {
  createComment,
  getCommentForModeration,
  updateCommentStatus
};

