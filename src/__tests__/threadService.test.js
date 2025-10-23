const { createThread } = require('../services/threadService');

jest.mock('../prisma', () => {
  const mock = {
    category: {
      findMany: jest.fn()
    },
    thread: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  };
  return mock;
});

jest.mock('../services/threadReviewService', () => ({
  reviewThread: jest.fn()
}));

const prisma = require('../prisma');
const { reviewThread } = require('../services/threadReviewService');

const buildThreadRecord = (overrides = {}) => ({
  id: 'thread-1',
  title: 'A better future',
  body: 'Discussing sustainable cities and communities initiatives.',
  tags: ['sustainable', 'cities'],
  image: null,
  review_score: 0,
  categories: [
    {
      category: { id: 'cat-11', name: 'Sustainable Cities and Communities', sdg_number: 11 }
    }
  ],
  _count: {
    replies: 0
  },
  ...overrides
});

describe('threadService.createThread', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-11' }
    ]);

    prisma.thread.create.mockResolvedValue(buildThreadRecord());
    prisma.thread.update.mockResolvedValue(buildThreadRecord({ review_score: 75 }));

    reviewThread.mockResolvedValue({ score: 75, reasoning: 'Matches SDG 11 well.' });
  });

  it('reviews a top-level thread and stores review score', async () => {
    const result = await createThread({
      authorId: 'user-1',
      title: 'A better future',
      body: 'Discussing sustainable cities and communities initiatives.',
      categoryIds: ['cat-11'],
      tags: ['sustainable', 'cities'],
      imagePath: null
    });

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['cat-11'] } },
      select: { id: true }
    });
    expect(prisma.thread.create).toHaveBeenCalled();
    expect(reviewThread).toHaveBeenCalledWith({
      title: 'A better future',
      body: 'Discussing sustainable cities and communities initiatives.',
      tags: ['sustainable', 'cities'],
      categories: expect.arrayContaining([
        expect.objectContaining({ name: 'Sustainable Cities and Communities' })
      ]),
      imagePath: null
    });
    expect(prisma.thread.update).toHaveBeenCalledWith({
      where: { id: 'thread-1' },
      data: { review_score: 75 }
    });
    expect(result.review_score).toBe(75);
    expect(result.counts).toEqual({ likes: 0, reposts: 0, replies: 0 });
  });

  it('skips review for reply threads', async () => {
    prisma.thread.findFirst.mockResolvedValue({ id: 'parent-thread', status: 'ACTIVE' });
    prisma.thread.create.mockResolvedValue(
      buildThreadRecord({ id: 'reply-1', parent_thread_id: 'parent-thread' })
    );

    const result = await createThread({
      authorId: 'user-1',
      title: 'Reply title',
      body: 'Reply body',
      categoryIds: ['cat-11'],
      tags: [],
      parentThreadId: 'parent-thread'
    });

    expect(reviewThread).not.toHaveBeenCalled();
    expect(prisma.thread.update).not.toHaveBeenCalled();
    expect(result.review_score).toBe(0);
  });
});
