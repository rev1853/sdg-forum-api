const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');

const MAX_CATEGORIES = 3;
const MIN_CATEGORIES = 1;

const normalizeCategoryIds = (categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    throw new ApiError(400, 'categoryIds must be an array');
  }

  const cleaned = [
    ...new Set(
      categoryIds
        .map((id) => (typeof id === 'string' ? id.trim() : ''))
        .filter(Boolean)
    )
  ];

  if (cleaned.length < MIN_CATEGORIES || cleaned.length > MAX_CATEGORIES) {
    throw new ApiError(400, `Select between ${MIN_CATEGORIES} and ${MAX_CATEGORIES} categories`);
  }

  return cleaned;
};

const ensureCategoriesExist = async (categoryIds) => {
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, sdg_number: true }
  });

  if (categories.length !== categoryIds.length) {
    throw new ApiError(404, 'One or more categories were not found');
  }

  return categories;
};

const createGroup = async (ownerId, { name, categoryIds }) => {
  if (!name || !name.trim()) {
    throw new ApiError(400, 'Group name is required');
  }

  const normalizedIds = normalizeCategoryIds(categoryIds);
  await ensureCategoriesExist(normalizedIds);

  const group = await prisma.chatGroup.create({
    data: {
      name: name.trim(),
      owner_id: ownerId,
      categories: {
        create: normalizedIds.map((id) => ({
          category: { connect: { id } }
        }))
      },
      members: {
        create: {
          user_id: ownerId,
          role: 'OWNER'
        }
      }
    },
    include: {
      categories: {
        include: { category: { select: { id: true, name: true, sdg_number: true } } }
      },
      members: {
        include: { user: { select: { id: true, username: true, name: true } } }
      }
    }
  });

  return group;
};

const listGroups = async ({ page = 1, pageSize = 20 }) => {
  const skip = (page - 1) * pageSize;

  const [groups, total] = await Promise.all([
    prisma.chatGroup.findMany({
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, sdg_number: true } } }
        },
        _count: {
          select: { members: true, messages: true }
        }
      }
    }),
    prisma.chatGroup.count()
  ]);

  return {
    data: groups,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
};

const getGroupById = async (groupId) => {
  const group = await prisma.chatGroup.findUnique({
    where: { id: groupId },
    include: {
      categories: {
        include: { category: { select: { id: true, name: true, sdg_number: true } } }
      },
      members: {
        include: { user: { select: { id: true, username: true, name: true } } },
        orderBy: { joined_at: 'asc' }
      },
      owner: { select: { id: true, username: true, name: true } },
      _count: {
        select: { members: true, messages: true }
      }
    }
  });

  if (!group) {
    throw new ApiError(404, 'Chat group not found');
  }

  return group;
};

const getActiveMembership = async (groupId, userId) => {
  return prisma.chatGroupMember.findUnique({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: userId
      }
    }
  });
};

const ensureGroupExists = async (groupId) => {
  const group = await prisma.chatGroup.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new ApiError(404, 'Chat group not found');
  }
  return group;
};

const ensureActiveMember = async (groupId, userId) => {
  const membership = await getActiveMembership(groupId, userId);
  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }
  if (membership.left_at) {
    throw new ApiError(403, 'You have left this group');
  }
  return membership;
};

const joinGroup = async (groupId, userId) => {
  await ensureGroupExists(groupId);

  const membership = await prisma.chatGroupMember.upsert({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: userId
      }
    },
    update: {
      left_at: null,
      role: 'MEMBER'
    },
    create: {
      group_id: groupId,
      user_id: userId,
      role: 'MEMBER'
    }
  });

  return membership;
};

const leaveGroup = async (groupId, userId) => {
  const membership = await getActiveMembership(groupId, userId);
  if (!membership) {
    throw new ApiError(404, 'Membership not found');
  }

  if (membership.role === 'OWNER') {
    throw new ApiError(400, 'Group owner cannot leave the group');
  }

  await prisma.chatGroupMember.update({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: userId
      }
    },
    data: {
      left_at: new Date()
    }
  });
};

module.exports = {
  createGroup,
  listGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  ensureActiveMember,
  ensureGroupExists,
  normalizeCategoryIds,
  ensureCategoriesExist
};

