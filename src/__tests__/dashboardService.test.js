const prisma = require('../prisma');

jest.mock('../prisma', () => ({
  interaction: {
    groupBy: jest.fn()
  },
  thread: {
    findMany: jest.fn()
  }
}));

const { getTopThreadsByInteraction } = require('../services/dashboardService');

describe('dashboardService.getTopThreadsByInteraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty list when no interactions', async () => {
    prisma.interaction.groupBy.mockResolvedValueOnce([]);

    const result = await getTopThreadsByInteraction();
    expect(result.threads).toHaveLength(0);
  });

  it('maps counts correctly with thread data', async () => {
    prisma.interaction.groupBy
      .mockResolvedValueOnce([
        { thread_id: 'thread-1', _count: { thread_id: 5 } }
      ])
      .mockResolvedValueOnce([
        { thread_id: 'thread-1', type: 'LIKE', _count: { thread_id: 3 } },
        { thread_id: 'thread-1', type: 'REPOST', _count: { thread_id: 2 } }
      ]);

    prisma.thread.findMany.mockResolvedValue([
      {
        id: 'thread-1',
        title: 'Thread title',
        body: 'Body',
        image: null,
        author: {
          id: 'user-1',
          username: 'alice',
          name: 'Alice',
          profile_picture: null,
          google_picture: 'https://example.com/avatar.png'
        },
        categories: []
      }
    ]);

    const result = await getTopThreadsByInteraction();

    expect(result.threads).toHaveLength(1);
    const [entry] = result.threads;
    expect(entry.interactionCount).toBe(5);
    expect(entry.likes).toBe(3);
    expect(entry.reposts).toBe(2);
    expect(entry.thread.author.profile_picture).toBe('https://example.com/avatar.png');
  });
});
