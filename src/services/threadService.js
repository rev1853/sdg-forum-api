const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');

const createThread = async (forum, authorId, { body, mediaPath }) => {
  if (!body) {
    throw new ApiError(400, 'Thread body is required');
  }

  const post = await prisma.post.create({
    data: {
      body: body.trim(),
      media: mediaPath || null,
      forum_id: forum.id,
      author_id: authorId
    },
    include: {
      author: { select: { id: true, username: true } },
      forum: { select: { id: true, slug: true, title: true } }
    }
  });

  return post;
};

const listForumThreads = async (forumId, { page = 1, pageSize = 10 }) => {
  const skip = (page - 1) * pageSize;

  const [threads, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        forum_id: forumId,
        status: 'ACTIVE'
      },
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { comments: true, interactions: true } }
      }
    }),
    prisma.post.count({
      where: {
        forum_id: forumId,
        status: 'ACTIVE'
      }
    })
  ]);

  return {
    data: threads,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    }
  };
};

const getThreadById = async (threadId, { includeRemoved = false } = {}) => {
  const thread = await prisma.post.findFirst({
    where: {
      id: threadId,
      ...(includeRemoved ? {} : { status: 'ACTIVE' })
    },
    include: {
      author: { select: { id: true, username: true } },
      forum: {
        include: {
          owner: { select: { id: true, username: true } }
        }
      },
      comments: {
        where: { status: 'ACTIVE' },
        orderBy: { created_at: 'asc' },
        include: {
          user: { select: { id: true, username: true } }
        }
      },
      _count: {
        select: { interactions: true, comments: true }
      }
    }
  });

  if (!thread) {
    throw new ApiError(404, 'Thread not found');
  }

  return thread;
};

const getThreadForModeration = async (threadId) => {
  const thread = await prisma.post.findUnique({
    where: { id: threadId },
    include: {
      forum: true,
      author: { select: { id: true, username: true } }
    }
  });

  if (!thread) {
    throw new ApiError(404, 'Thread not found');
  }

  return thread;
};

const updateThreadStatus = async (threadId, status) => {
  if (!['ACTIVE', 'REMOVED'].includes(status)) {
    throw new ApiError(400, 'Invalid thread status');
  }

  const thread = await prisma.post.update({
    where: { id: threadId },
    data: { status },
    include: {
      forum: { select: { id: true, slug: true, owner_id: true } },
      author: { select: { id: true, username: true } }
    }
  });

  return thread;
};

module.exports = {
  createThread,
  listForumThreads,
  getThreadById,
  getThreadForModeration,
  updateThreadStatus
};

