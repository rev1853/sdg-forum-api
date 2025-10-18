const { randomUUID } = require('crypto');
const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const buildUniqueSlug = async (title) => {
  const baseSlug = slugify(title) || randomUUID();
  let candidate = baseSlug;
  let attempts = 0;

  while (attempts < 5) {
    const existing = await prisma.forum.findUnique({
      where: { slug: candidate }
    });
    if (!existing) {
      return candidate;
    }
    attempts += 1;
    candidate = `${baseSlug}-${attempts}`;
  }

  return `${baseSlug}-${randomUUID().slice(0, 6)}`;
};

const createForum = async (ownerId, { title, description, categoryIds }) => {
  if (!title) {
    throw new ApiError(400, 'Title is required');
  }

  const slug = await buildUniqueSlug(title);

  const data = {
    title: title.trim(),
    description: description ? description.trim() : null,
    slug,
    owner_id: ownerId
  };

  const forum = await prisma.forum.create({
    data: {
      ...data,
      categories: categoryIds && categoryIds.length
        ? {
            create: categoryIds.map((categoryId) => ({
              category: {
                connect: { id: categoryId }
              }
            }))
          }
        : undefined
    },
    include: {
      owner: { select: { id: true, username: true } },
      categories: {
        include: { category: { select: { id: true, name: true } } }
      }
    }
  });

  return forum;
};

const listForums = async ({ page = 1, pageSize = 10 }) => {
  const skip = (page - 1) * pageSize;

  const [forums, total] = await Promise.all([
    prisma.forum.findMany({
      where: { status: 'ACTIVE' },
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        owner: { select: { id: true, username: true } },
        _count: { select: { followers: true, posts: true } }
      }
    }),
    prisma.forum.count({ where: { status: 'ACTIVE' } })
  ]);

  return {
    data: forums,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    }
  };
};

const getForumBySlug = async (slug, { includeRemoved = false } = {}) => {
  const forum = await prisma.forum.findFirst({
    where: {
      slug,
      ...(includeRemoved ? {} : { status: 'ACTIVE' })
    },
    include: {
      owner: { select: { id: true, username: true } },
      categories: {
        include: { category: { select: { id: true, name: true, sdg_number: true } } }
      },
      _count: { select: { followers: true, posts: true } }
    }
  });

  if (!forum) {
    throw new ApiError(404, 'Forum not found');
  }

  return forum;
};

const assertForumOwner = (forum, userId) => {
  if (forum.owner_id !== userId) {
    throw new ApiError(403, 'Only forum owner can perform this action');
  }
};

const softDeleteForum = async (forum, userId) => {
  assertForumOwner(forum, userId);

  await prisma.$transaction([
    prisma.forum.update({
      where: { id: forum.id },
      data: { status: 'REMOVED' }
    }),
    prisma.post.updateMany({
      where: { forum_id: forum.id },
      data: { status: 'REMOVED' }
    })
  ]);
};

const followForum = async (forum, userId) => {
  if (forum.owner_id === userId) {
    throw new ApiError(400, 'Forum owner is automatically subscribed');
  }

  const relation = await prisma.forumFollower.upsert({
    where: {
      user_id_forum_id: {
        user_id: userId,
        forum_id: forum.id
      }
    },
    update: {},
    create: {
      user_id: userId,
      forum_id: forum.id
    }
  });

  return relation;
};

const unfollowForum = async (forum, userId) => {
  await prisma.forumFollower.deleteMany({
    where: {
      user_id: userId,
      forum_id: forum.id
    }
  });
};

const setModeratorStatus = async (forum, targetUserId, isModerator, requesterId) => {
  assertForumOwner(forum, requesterId);

  const relation = await prisma.forumFollower.findUnique({
    where: {
      user_id_forum_id: {
        user_id: targetUserId,
        forum_id: forum.id
      }
    }
  });

  if (!relation) {
    throw new ApiError(404, 'Follower not found');
  }

  return prisma.forumFollower.update({
    where: {
      user_id_forum_id: {
        user_id: targetUserId,
        forum_id: forum.id
      }
    },
    data: { is_moderator: !!isModerator }
  });
};

const isForumModerator = async (forumId, userId) => {
  const follower = await prisma.forumFollower.findUnique({
    where: {
      user_id_forum_id: {
        user_id: userId,
        forum_id: forumId
      }
    }
  });

  return follower?.is_moderator || false;
};

module.exports = {
  createForum,
  listForums,
  getForumBySlug,
  softDeleteForum,
  followForum,
  unfollowForum,
  setModeratorStatus,
  isForumModerator,
  assertForumOwner
};

