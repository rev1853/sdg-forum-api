const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');

jest.mock('../prisma', () => ({
  category: {
    findMany: jest.fn()
  },
  chatGroup: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn()
  },
  chatGroupCategory: {
    findMany: jest.fn()
  },
  chatGroupMember: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn()
  }
}));

const {
  listGroups,
  getGroupById,
  createGroup,
  joinGroup,
  leaveGroup
} = require('../services/chatGroupService');

const buildGroupRecord = () => ({
  id: 'sdg-group-1',
  name: 'SDG 1: No Poverty',
  categories: [
    { category: { id: 'cat-1', name: 'No Poverty', sdg_number: 1 } }
  ],
  _count: { members: 0, messages: 0 }
});

describe('chatGroupService (fixed SDG groups)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'No Poverty', sdg_number: 1 }
    ]);
    prisma.chatGroupCategory.findMany.mockResolvedValue([]);
    prisma.chatGroup.create.mockResolvedValue(buildGroupRecord());
  });

  it('creates missing SDG groups and lists them', async () => {
    prisma.chatGroup.findMany.mockResolvedValue([buildGroupRecord()]);
    prisma.chatGroup.count.mockResolvedValue(1);

    const result = await listGroups({ page: 1, pageSize: 10 });

    expect(prisma.chatGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'sdg-group-1'
        })
      })
    );
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('fetches a group by id after ensuring SDG groups exist', async () => {
    prisma.chatGroup.findUnique.mockResolvedValue(buildGroupRecord());

    const group = await getGroupById('sdg-group-1');
    expect(group.id).toBe('sdg-group-1');
  });

  it('rejects legacy create/join/leave operations', async () => {
    await expect(
      createGroup('user-1', { name: 'Legacy', categoryIds: ['cat-1'] })
    ).rejects.toThrow(ApiError);
    await expect(joinGroup('group-1', 'user-1')).rejects.toThrow(ApiError);
    await expect(leaveGroup('group-1', 'user-1')).rejects.toThrow(ApiError);
  });
});
