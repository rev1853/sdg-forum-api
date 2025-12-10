const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');
const {
  reviewNewThread,
  checkReportThreshold
} = require('./threadAutoModerationService');
const { reviewThread } = require('./threadReviewService');

const MATCH_THRESHOLD = Number(process.env.THREAD_REVIEW_MATCH_THRESHOLD ?? 70);
const RELEVANCE_ERROR_MESSAGE =
  'Thread is not valid because the message is not relevant with the categories';
const RELEVANCE_UNAVAILABLE_MESSAGE =
  'Thread relevance check is unavailable, please try again';
const RELEVANCE_ERROR_STATUS = 'REVIEW_FAILED';

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
  const { _count = {}, categories = [], review_score = 0, author, ...rest } = thread;

  const normalizedAuthor = author
    ? {
      id: author.id,
      username: author.username,
      name: author.name,
      profile_picture: author.profile_picture || author.google_picture || null
    }
    : null;

  return {
    ...rest,
    categories: normalizeCategories(categories),
    author: normalizedAuthor,
    review_score,
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
    select: { id: true, name: true, sdg_number: true }
  });

  if (categories.length !== uniqueIds.length) {
    throw new ApiError(404, 'One or more categories do not exist');
  }

  return { ids: uniqueIds, categories };
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

const ensureThreadRelevance = async ({ title, body, tags, categories, imagePath }) => {
  try {
    const review = await reviewThread({
      title,
      body,
      tags: tags ?? [],
      categories: categories ?? [],
      imagePath: imagePath || null
    });

    if (!review || typeof review.score !== 'number') {
      throw new ApiError(503, RELEVANCE_UNAVAILABLE_MESSAGE, {
        status: RELEVANCE_ERROR_STATUS
      });
    }

    if (review.score < MATCH_THRESHOLD) {
      throw new ApiError(400, RELEVANCE_ERROR_MESSAGE, {
        status: RELEVANCE_ERROR_STATUS,
        score: review.score,
        review_text: review.recommendation || review.reasoning || ''
      });
    }

    return review;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Thread relevance check failed', error);
    throw new ApiError(503, RELEVANCE_UNAVAILABLE_MESSAGE, {
      status: RELEVANCE_ERROR_STATUS
    });
  }
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
  let selectedCategories = [];

  if (parentThreadId) {
    await ensureActiveThread(parentThreadId);

    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const { ids: validIds, categories } = await validateCategorySelection(categoryIds);
      selectedCategories = categories;
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

    const { ids: validIds, categories } = await validateCategorySelection(categoryIds || []);
    selectedCategories = categories;
    categoryConnect = {
      create: validIds.map((id) => ({
        category: { connect: { id } }
      }))
    };
  }

  let preReview = null;

  if (!parentThreadId) {
    preReview = await ensureThreadRelevance({
      title: data.title,
      body: data.body,
      tags: sanitizedTags,
      categories: selectedCategories,
      imagePath
    });

    if (preReview) {
      data.review_score = preReview.score;
    }
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

  if (!parentThreadId && !preReview) {
    try {
      const review = await reviewNewThread({
        ...thread,
        tags: sanitizedTags,
        categories: thread.categories
      });

      if (review && review.score !== undefined) {
        thread.review_score = review.score;
      }
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 400) {
        throw error;
      }
      console.error('Thread review failed', error);
    }
  } else if (preReview) {
    thread.review_score = preReview.score;
  }

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
          contains: search
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
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profile_picture: true,
            google_picture: true
          }
        },
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
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          profile_picture: true,
          google_picture: true
        }
      },
      parent: {
        select: {
          id: true,
          title: true,
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              profile_picture: true,
              google_picture: true
            }
          }
        }
      },
      categories: {
        include: { category: { select: { id: true, name: true, sdg_number: true } } }
      },
      replies: {
        where: { status: 'ACTIVE' },
        orderBy: { created_at: 'asc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              profile_picture: true,
              google_picture: true
            }
          },
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
  if (formattedThread.parent?.author) {
    const parentAuthor = formattedThread.parent.author;
    formattedThread.parent.author = {
      id: parentAuthor.id,
      username: parentAuthor.username,
      name: parentAuthor.name,
      profile_picture:
        parentAuthor.profile_picture || parentAuthor.google_picture || null
    };
  }

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
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profile_picture: true,
            google_picture: true
          }
        },
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

  await checkReportThreshold(threadId);

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
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profile_picture: true,
            google_picture: true
          }
        },
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
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                profile_picture: true,
                google_picture: true
              }
            },
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

const removeThread = async (threadId, userId) => {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { id: true, author_id: true, status: true }
  });

  if (!thread) {
    throw new ApiError(404, 'Thread not found');
  }

  if (thread.author_id !== userId) {
    throw new ApiError(403, 'Only the thread owner can remove this thread');
  }

  if (thread.status === 'REMOVED') {
    return;
  }

  await prisma.$transaction([
    prisma.thread.update({
      where: { id: threadId },
      data: { status: 'REMOVED' }
    }),
    prisma.thread.updateMany({
      where: { parent_thread_id: threadId },
      data: { status: 'REMOVED' }
    })
  ]);
};

const updateThread = async (threadId, userId, { title, body, tags, categoryIds, imagePath }) => {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { id: true, author_id: true, status: true }
  });

  if (!thread) {
    throw new ApiError(404, 'Thread not found');
  }

  if (thread.author_id !== userId) {
    throw new ApiError(403, 'Only the thread owner can update this thread');
  }

  if (thread.status === 'REMOVED') {
    throw new ApiError(400, 'Cannot update a removed thread');
  }

  const data = {};
  if (title !== undefined) data.title = title.trim();
  if (body !== undefined) data.body = body.trim();
  if (imagePath !== undefined) data.image = imagePath;
  if (tags !== undefined) data.tags = sanitizeTags(tags);

  if (categoryIds !== undefined) {
    const { ids: validIds } = await validateCategorySelection(categoryIds);
    data.categories = {
      deleteMany: {},
      create: validIds.map((id) => ({
        category: { connect: { id } }
      }))
    };
  }

  const updatedThread = await prisma.thread.update({
    where: { id: threadId },
    data,
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

  return applyMetrics(updatedThread);
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
  listUserReposts,
  removeThread,
  updateThread
};
