const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');

const sanitizeTags = (tags) => {
  if (!tags) {
    return [];
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => tag.toLowerCase());
  }

  if (Array.isArray(tags)) {
    return [
      ...new Set(
        tags
          .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
          .filter(Boolean)
      )
    ];
  }

  throw new ApiError(400, 'Tags must be a string or an array of strings');
};

const normalizeCategories = (items = []) =>
  items
    .map((item) => item?.category || item)
    .filter(Boolean);

const summarizeInteractions = async (threadIds) => {
  if (!threadIds.length) {
    return {};
  }

  const grouped = await prisma.interaction.groupBy({
    by: ['thread_id', 'type'],
    where: {
      thread_id: { in: threadIds }
    },
    _count: {
      _all: true
    }
  });

  const map = {};

  for (const id of threadIds) {
    map[id] = { likes: 0, reposts: 0 };
  }

  grouped.forEach(({ thread_id: id, type, _count }) => {
    if (!map[id]) {
      map[id] = { likes: 0, reposts: 0 };
    }

    if (type === 'LIKE') {
      map[id].likes = _count._all;
    } else if (type === 'REPOST') {
      map[id].reposts = _count._all;
    }
  });

  return map;
};

const applyMetrics = (thread, metrics = { likes: 0, reposts: 0 }) => {
  const { _count = {}, categories = [], ...rest } = thread;

  return {
    ...rest,
    categories: normalizeCategories(categories),
    counts: {
      likes: metrics.likes ?? 0,
      reposts: metrics.reposts ?? 0,
      replies: _count.replies ?? 0
    }
  };
};

const applyMetricsToCollection = async (threads) => {
  if (!threads.length) {
    return [];
  }

  const metricsMap = await summarizeInteractions(threads.map((thread) => thread.id));
  return threads.map((thread) => applyMetrics(thread, metricsMap[thread.id]));
};

const validateCategorySelection = async (categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    throw new ApiError(400, 'categoryIds must be an array');
  }

  if (categoryIds.length < 1 || categoryIds.length > 3) {
    throw new ApiError(400, 'You must choose between 1 and 3 categories');
  }

  const uniqueIds = [...new Set(categoryIds)];
  if (uniqueIds.length !== categoryIds.length) {
    throw new ApiError(400, 'Duplicate categories are not allowed');
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true }
  });

  if (categories.length !== uniqueIds.length) {
    throw new ApiError(404, 'One or more categories do not exist');
  }

  return uniqueIds;
};

const ensureActiveThread = async (threadId) => {
  const thread = await prisma.thread.findFirst({
    where: { id: threadId, status: 'ACTIVE' },
    select: { id: true }
  });

  if (!thread) {
    throw new ApiError(404, 'Thread not found');
  }

  return thread;
};

const createThread = async ({
  authorId,
  title,
  body,
  tags,
  categoryIds,
  imagePath,
  parentThreadId
}) => {
  if (!body || typeof body !== 'string' || !body.trim()) {
    throw new ApiError(400, 'Thread body is required');
  }

  const sanitizedTags = sanitizeTags(tags);
  const data = {
    author_id: authorId,
    title: title ? title.trim() : null,
    body: body.trim(),
    image: imagePath || null,
    tags: sanitizedTags,
    parent_thread_id: parentThreadId || null
  };

  let categoryConnect;

  if (parentThreadId) {
    await ensureActiveThread(parentThreadId);

    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const validIds = await validateCategorySelection(categoryIds);
      categoryConnect = {
        create: validIds.map((id) => ({
          category: { connect: { id } }
        }))
      };
    }

    if (!data.title) {
      const parent = await prisma.thread.findUnique({
        where: { id: parentThreadId },
        select: { title: true }
      });
      data.title = parent?.title ? `Re: ${parent.title}` : 'Reply';
    }
  } else {
    if (!title || !title.trim()) {
      throw new ApiError(400, 'Thread title is required');
    }

    const validIds = await validateCategorySelection(categoryIds || []);
    categoryConnect = {
      create: validIds.map((id) => ({
        category: { connect: { id } }
      }))
    };
  }

  const thread = await prisma.thread.create({
    data: {
      ...data,
      categories: categoryConnect
    },
    include: {
      author: { select: { id: true, username: true, name: true } },
      categories: {
        include: { category: { select: { id: true, name: true, sdg_number: true } } }
      },
      parent: {
        select: { id: true, title: true }
      },
      _count: {
        select: { replies: true }
      }
    }
  });

  return applyMetrics(thread);
};

const listThreads = async ({
  page = 1,
  pageSize = 10,
  tags = [],
  categoryIds = [],
  search
}) => {
  const skip = (page - 1) * pageSize;

  const where = {
    status: 'ACTIVE',
    parent_thread_id: null,
    ...(search
      ? {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        }
      : {}),
    ...(tags.length
      ? {
          tags: {
            array_contains: tags
          }
        }
      : {}),
    ...(categoryIds.length
      ? {
          categories: {
            some: {
              category_id: { in: categoryIds }
            }
          }
        }
      : {})
  };

  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        author: { select: { id: true, username: true, name: true } },
        categories: {
          include: { category: { select: { id: true, name: true, sdg_number: true } } }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    }),
    prisma.thread.count({ where })
  ]);

  const formatted = await applyMetricsToCollection(threads);

  return {
    data: formatted,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
};

const getThreadById = async (threadId) => {
  const thread = await prisma.thread.findFirst({
    where: { id: threadId, status: 'ACTIVE' },
    include: {
      author: { select: { id: true, username: true, name: true } },
      parent: {
        select: {
          id: true,
          title: true,
          author: { select: { id: true, username: true, name: true } }
        }
      },
      categories: {
        include: { category: { select: { id: true, name: true, sdg_number: true } } }
      },
      replies: {
        where: { status: 'ACTIVE' },
        orderBy: { created_at: 'asc' },
        include: {
          author: { select: { id: true, username: true, name: true } },
          categories: {
            include: { category: { select: { id: true, name: true, sdg_number: true } } }
          },
          _count: { select: { replies: true } }
        }
      },
      _count: {
        select: {
          replies: true
        }
      }
    }
  });

  if (!thread) {
    throw new ApiError(404, 'Thread not found');
  }

  const replyIds = thread.replies.map((reply) => reply.id);
  const metricsMap = await summarizeInteractions([thread.id, ...replyIds]);

  const formattedReplies = thread.replies.map((reply) =>
    applyMetrics(reply, metricsMap[reply.id])
  );

  const formattedThread = applyMetrics(thread, metricsMap[thread.id]);
  formattedThread.replies = formattedReplies;

  return formattedThread;
};

const listThreadReplies = async (threadId, { page = 1, pageSize = 10 }) => {
  await ensureActiveThread(threadId);

  const skip = (page - 1) * pageSize;

  const [replies, total] = await Promise.all([
    prisma.thread.findMany({
      where: {
        parent_thread_id: threadId,
        status: 'ACTIVE'
      },
      skip,
      take: pageSize,
      orderBy: { created_at: 'asc' },
      include: {
        author: { select: { id: true, username: true, name: true } },
        categories: {
          include: { category: { select: { id: true, name: true, sdg_number: true } } }
        },
        _count: { select: { replies: true } }
      }
    }),
    prisma.thread.count({
      where: {
        parent_thread_id: threadId,
        status: 'ACTIVE'
      }
    })
  ]);

  const formattedReplies = await applyMetricsToCollection(replies);

  return {
    data: formattedReplies,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
};

const likeThread = async (threadId, userId) => {
  await ensureActiveThread(threadId);

  const interaction = await prisma.interaction.upsert({
    where: {
      thread_id_user_id_type: {
        thread_id: threadId,
        user_id: userId,
        type: 'LIKE'
      }
    },
    update: {},
    create: {
      thread_id: threadId,
      user_id: userId,
      type: 'LIKE'
    }
  });

  return interaction;
};

const unlikeThread = async (threadId, userId) => {
  try {
    await prisma.interaction.delete({
      where: {
        thread_id_user_id_type: {
          thread_id: threadId,
          user_id: userId,
          type: 'LIKE'
        }
      }
    });
  } catch (error) {
    throw new ApiError(404, 'Like interaction not found');
  }
};

const repostThread = async (threadId, userId) => {
  await ensureActiveThread(threadId);

  const interaction = await prisma.interaction.upsert({
    where: {
      thread_id_user_id_type: {
        thread_id: threadId,
        user_id: userId,
        type: 'REPOST'
      }
    },
    update: {},
    create: {
      thread_id: threadId,
      user_id: userId,
      type: 'REPOST'
    }
  });

  return interaction;
};

const unrepostThread = async (threadId, userId) => {
  try {
    await prisma.interaction.delete({
      where: {
        thread_id_user_id_type: {
          thread_id: threadId,
          user_id: userId,
          type: 'REPOST'
        }
      }
    });
  } catch (error) {
    throw new ApiError(404, 'Repost interaction not found');
  }
};

const createReport = async (threadId, reporterId, { reasonCode, message }) => {
  await ensureActiveThread(threadId);

  if (!reasonCode || !reasonCode.trim()) {
    throw new ApiError(400, 'reasonCode is required');
  }

  const report = await prisma.report.create({
    data: {
      thread_id: threadId,
      reporter_id: reporterId,
      reason_code: reasonCode.trim(),
      message: message ? message.trim() : null
    }
  });

  return report;
};

const listUserThreads = async (userId, { page = 1, pageSize = 10 }) => {
  const skip = (page - 1) * pageSize;

  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where: {
        author_id: userId,
        status: 'ACTIVE',
        parent_thread_id: null
      },
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, sdg_number: true } } }
        },
        _count: { select: { replies: true } }
      }
    }),
    prisma.thread.count({
      where: {
        author_id: userId,
        status: 'ACTIVE',
        parent_thread_id: null
      }
    })
  ]);

  const formattedThreads = await applyMetricsToCollection(threads);

  return {
    data: formattedThreads,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
};

const listUserReposts = async (userId, { page = 1, pageSize = 10 }) => {
  const skip = (page - 1) * pageSize;

  const [interactions, total] = await Promise.all([
    prisma.interaction.findMany({
      where: {
        user_id: userId,
        type: 'REPOST',
        thread: {
          status: 'ACTIVE'
        }
      },
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        thread: {
          include: {
            author: { select: { id: true, username: true, name: true } },
            categories: {
              include: {
                category: { select: { id: true, name: true, sdg_number: true } }
              }
            },
            _count: { select: { replies: true } }
          }
        }
      }
    }),
    prisma.interaction.count({
      where: {
        user_id: userId,
        type: 'REPOST',
        thread: {
          status: 'ACTIVE'
        }
      }
    })
  ]);

  const threadMetrics = await summarizeInteractions(
    interactions.map((interaction) => interaction.thread.id)
  );

  const reposts = interactions.map((interaction) => ({
    id: interaction.id,
    reposted_at: interaction.created_at,
    thread: applyMetrics(interaction.thread, threadMetrics[interaction.thread.id])
  }));

  return {
    data: reposts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
};

module.exports = {
  sanitizeTags,
  createThread,
  listThreads,
  getThreadById,
  listThreadReplies,
  likeThread,
  unlikeThread,
  repostThread,
  unrepostThread,
  createReport,
  listUserThreads,
  listUserReposts
};

