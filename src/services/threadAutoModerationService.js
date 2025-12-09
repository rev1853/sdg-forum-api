const prisma = require('../prisma');
const { reviewThread } = require('./threadReviewService');
const ApiError = require('../utils/ApiError');

const MATCH_THRESHOLD = Number(process.env.THREAD_REVIEW_MATCH_THRESHOLD ?? 70);
const REPORT_THRESHOLD = Number(process.env.THREAD_REPORT_THRESHOLD ?? 10);

const evaluateReviewScore = (review) => {
  if (!review || typeof review.score !== 'number') {
    return null;
  }
  return review.score;
};

const handleLowScore = async (threadId, score) => {
  await prisma.thread.update({
    where: { id: threadId },
    data: { status: 'REMOVED', review_score: score }
  });

  throw new ApiError(
    400,
    'Thread is not valid because the message is not relevant with the categories'
  );
};

const reviewNewThread = async (thread) => {
  const review = await reviewThread({
    title: thread.title,
    body: thread.body,
    tags: thread.tags ?? [],
    categories: thread.categories.map((c) => c.category),
    imagePath: thread.image ?? null
  });

  if (!review) {
    return null;
  }

  const score = evaluateReviewScore(review);
  if (score !== null) {
    if (score < MATCH_THRESHOLD) {
      await handleLowScore(thread.id, score);
    }

    await prisma.thread.update({
      where: { id: thread.id },
      data: { review_score: score }
    });
  }

  return review;
};

const reviewReportedThread = async (threadId) => {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      categories: {
        include: { category: true }
      }
    }
  });

  if (!thread || thread.status !== 'ACTIVE') {
    return;
  }

  const review = await reviewThread({
    title: thread.title,
    body: thread.body,
    tags: thread.tags ?? [],
    categories: thread.categories.map((c) => c.category),
    imagePath: thread.image ?? null
  });

  const score = evaluateReviewScore(review);
  if (score !== null) {
    if (score < MATCH_THRESHOLD) {
      await handleLowScore(thread.id, score);
    } else {
      await prisma.thread.update({
        where: { id: thread.id },
        data: { review_score: score }
      });
    }
  }
};

const checkReportThreshold = async (threadId) => {
  const reportsCount = await prisma.report.count({
    where: { thread_id: threadId }
  });

  if (reportsCount >= REPORT_THRESHOLD) {
    await reviewReportedThread(threadId);
  }
};

module.exports = {
  reviewNewThread,
  reviewReportedThread,
  checkReportThreshold
};
