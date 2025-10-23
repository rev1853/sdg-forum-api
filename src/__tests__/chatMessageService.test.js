const prisma = require('../prisma');
const { generateMessageId } = require('../utils/messageId');

jest.mock('../prisma', () => ({
  chatGroup: {
    findUnique: jest.fn()
  },
  chatGroupMember: {
    findUnique: jest.fn()
  },
  chatMessage: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn()
  }
}));

jest.mock('../services/chatGroupService', () => ({
  ensureGroupExists: jest.fn(async () => ({})),
  ensureActiveMember: jest.fn(async () => ({ group_id: 'group-1', user_id: 'user-1', left_at: null }))
}));

jest.mock('../utils/messageId', () => ({
  generateMessageId: jest.fn(() => 'abc123000')
}));

const { createMessage, listMessages } = require('../services/chatMessageService');
const { ensureActiveMember } = require('../services/chatGroupService');

const buildMessageRecord = () => ({
  id: 'abc123000',
  group_id: 'group-1',
  user_id: 'user-1',
  body: 'Hello world',
  reply_to_id: null,
  created_at: new Date().toISOString(),
  user: { id: 'user-1', username: 'alice', name: 'Alice' },
  reply_to: null
});

describe('chatMessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.chatMessage.create.mockResolvedValue(buildMessageRecord());
    prisma.chatMessage.findMany.mockResolvedValue([buildMessageRecord()]);
  });

  it('creates a message and generates id', async () => {
    const message = await createMessage({
      groupId: 'group-1',
      userId: 'user-1',
      body: 'Hello world'
    });

    expect(generateMessageId).toHaveBeenCalled();
    expect(prisma.chatMessage.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id: 'abc123000',
        body: 'Hello world'
      })
    }));
    expect(message.id).toBe('abc123000');
  });

  it('rejects empty message bodies', async () => {
    await expect(
      createMessage({ groupId: 'group-1', userId: 'user-1', body: '   ' })
    ).rejects.toThrow();
  });

  it('lists messages with pagination', async () => {
    const messages = await listMessages('group-1', 'user-1', { after: 'abc', limit: 10 });

    expect(ensureActiveMember).toHaveBeenCalledWith('group-1', 'user-1');
    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { gt: 'abc' } }),
      take: 10
    }));
    expect(messages).toHaveLength(1);
  });
});
