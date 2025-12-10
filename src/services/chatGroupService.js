const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');

const SDG_GROUP_COUNT = 17;
const SDG_GROUP_PREFIX = 'sdg-group-';

const buildGroupId = (sdgNumber) => `${SDG_GROUP_PREFIX}${sdgNumber}`;

const ensureSdgGroups = async () => {
  const categories = await prisma.category.findMany({
    where: { sdg_number: { gte: 1, lte: SDG_GROUP_COUNT } },
    select: { id: true, name: true, sdg_number: true },
    orderBy: { sdg_number: 'asc' }
  });

  if (!categories.length) {
    throw new ApiError(503, 'No SDG categories found to build chat groups');
  }

  const categoryIds = categories.map((c) => c.id);

  const existingMappings = await prisma.chatGroupCategory.findMany({
    where: { category_id: { in: categoryIds } },
    include: {
      group: true
    }
  });

  const existingByCategory = new Map(
    existingMappings.map((mapping) => [mapping.category_id, mapping.group])
  );

  for (const category of categories) {
    if (existingByCategory.has(category.id)) {
      continue;
    }

    await prisma.chatGroup.create({
      data: {
        id: buildGroupId(category.sdg_number),
        name: `SDG ${category.sdg_number}: ${category.name}`,
        categories: {
          create: {
            category: { connect: { id: category.id } }
          }
        }
      }
    });
  }
};

const listGroups = async ({ page = 1, pageSize = 20 }) => {
  await ensureSdgGroups();
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
  await ensureSdgGroups();
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
  await ensureGroupExists(groupId);
  return {
    group_id: groupId,
    user_id: userId,
    left_at: null
  };
};

const createGroup = async () => {
  throw new ApiError(410, 'Chat groups are fixed to SDG categories and cannot be created');
};

const joinGroup = async (groupId, userId) => {
  throw new ApiError(410, 'Chat groups are fixed and cannot be joined');
};

const leaveGroup = async (groupId, userId) => {
  throw new ApiError(410, 'Chat groups are fixed and cannot be left');
};

module.exports = {
  listGroups,
  getGroupById,
  createGroup,
  joinGroup,
  leaveGroup,
  ensureActiveMember,
  ensureGroupExists,
  ensureSdgGroups
};
