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
  chatGroupMember: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn()
  }
}));

const {
  createGroup,
  joinGroup,
  leaveGroup,
  listGroups,
  getGroupById
} = require('../services/chatGroupService');

const buildGroupRecord = () => ({
  id: 'group-1',
  name: 'Climate Action',
  owner_id: 'user-1',
  categories: [
    { category: { id: 'cat-13', name: 'Climate Action', sdg_number: 13 } }
  ],
  members: [],
  _count: { members: 1, messages: 0 }
});

describe('chatGroupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('creates a group with valid categories', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 'cat-13' }]);
      prisma.chatGroup.create.mockResolvedValue(buildGroupRecord());

      const result = await createGroup('user-1', {
        name: 'Climate Action',
        categoryIds: ['cat-13']
      });

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['cat-13'] } },
        select: { id: true, name: true, sdg_number: true }
      });
      expect(prisma.chatGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Climate Action',
            owner_id: 'user-1'
          })
        })
      );
      expect(result.id).toBe('group-1');
    });

    it('throws when categories missing', async () => {
      await expect(
        createGroup('user-1', { name: 'Test', categoryIds: [] })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('joinGroup / leaveGroup', () => {
    beforeEach(() => {
      prisma.chatGroup.findUnique.mockResolvedValue(buildGroupRecord());
      prisma.chatGroupMember.findUnique.mockResolvedValue(null);
    });

    it('allows user to join group', async () => {
      prisma.chatGroupMember.upsert.mockResolvedValue({ group_id: 'group-1', user_id: 'user-2' });

      await expect(joinGroup('group-1', 'user-2')).resolves.toBeDefined();

      expect(prisma.chatGroupMember.upsert).toHaveBeenCalled();
    });

    it('prevents owner from leaving', async () => {
      prisma.chatGroupMember.findUnique.mockResolvedValue({
        group_id: 'group-1',
        user_id: 'user-1',
        role: 'OWNER',
        left_at: null
      });

      await expect(leaveGroup('group-1', 'user-1')).rejects.toThrow(ApiError);
    });
  });

  describe('listGroups & getGroupById', () => {
    it('returns paginated list', async () => {
      prisma.chatGroup.findMany.mockResolvedValue([buildGroupRecord()]);
      prisma.chatGroup.count.mockResolvedValue(1);

      const result = await listGroups({ page: 1, pageSize: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('fetches group details', async () => {
      prisma.chatGroup.findUnique.mockResolvedValue(buildGroupRecord());

      const group = await getGroupById('group-1');
      expect(group.id).toBe('group-1');
    });
  });
});
