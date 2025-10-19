const prisma = require('../prisma');

const normalizeCategories = (items = []) =>
  items
    .map((item) => item?.category || item)
    .filter(Boolean);

const getStartOfWindow = () => {
  const now = new Date();
  const window = new Date(now);
  window.setDate(now.getDate() - 7);
  return window;
};

const getWeeklyThreadStats = async () => {
  const since = getStartOfWindow();

  const totalThreads = await prisma.thread.count({
    where: {
      status: 'ACTIVE',
      parent_thread_id: null,
      created_at: {
        gte: since
      }
    }
  });

  const totalReplies = await prisma.thread.count({
    where: {
      status: 'ACTIVE',
      NOT: {
        parent_thread_id: null
      },
      created_at: {
        gte: since
      }
    }
  });

  const totalInteractions = await prisma.interaction.count({
    where: {
      created_at: { gte: since },
      thread: { status: 'ACTIVE' }
    }
  });

  return {
    since,
    totalThreads,
    totalReplies,
    totalInteractions
  };
};

const getTopThreadsByInteraction = async () => {
  const since = getStartOfWindow();

  const groupedTotals = await prisma.interaction.groupBy({
    by: ['thread_id'],
    where: {
      created_at: { gte: since },
      thread: {
        status: 'ACTIVE'
      }
    },
    _count: {
      _all: true
    },
    orderBy: {
      _count: {
        _all: 'desc'
      }
    },
    take: 10
  });

  if (!groupedTotals.length) {
    return {
      since,
      threads: []
    };
  }

  const threadIds = groupedTotals.map((item) => item.thread_id);

  const groupedByType = await prisma.interaction.groupBy({
    by: ['thread_id', 'type'],
    where: {
      created_at: { gte: since },
      thread_id: { in: threadIds }
    },
    _count: {
      _all: true
    }
  });

  const interactionsByThread = groupedByType.reduce((acc, item) => {
    if (!acc[item.thread_id]) {
      acc[item.thread_id] = {
        likes: 0,
        reposts: 0
      };
    }

    if (item.type === 'LIKE') {
      acc[item.thread_id].likes = item._count._all;
    } else if (item.type === 'REPOST') {
      acc[item.thread_id].reposts = item._count._all;
    }

    return acc;
  }, {});

  const threads = await prisma.thread.findMany({
    where: { id: { in: threadIds } },
    include: {
      author: { select: { id: true, username: true, name: true } },
      categories: {
        include: { category: { select: { id: true, name: true, sdg_number: true } } }
      }
    }
  });

  const threadMap = threads.reduce((acc, thread) => {
    acc[thread.id] = thread;
    return acc;
  }, {});

  const ranked = groupedTotals
    .map((item) => {
      const thread = threadMap[item.thread_id];
      if (!thread) {
        return null;
      }
      const counts = interactionsByThread[item.thread_id] || { likes: 0, reposts: 0 };
      return {
        interactionCount: item._count._all,
        likes: counts.likes,
        reposts: counts.reposts,
        thread: {
          ...thread,
          categories: normalizeCategories(thread.categories)
        }
      };
    })
    .filter(Boolean);

  return {
    since,
    threads: ranked
  };
};

module.exports = {
  getWeeklyThreadStats,
  getTopThreadsByInteraction
};
