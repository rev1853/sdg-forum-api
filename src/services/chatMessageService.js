const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');
const { generateMessageId } = require('../utils/messageId');
const { ensureGroupExists, ensureSdgGroups } = require('./chatGroupService');

const MAX_MESSAGE_LENGTH = 2000;

const sanitizeBody = (body) => {
  if (typeof body !== 'string') {
    return '';
  }
  return body.trim();
};

const createMessage = async ({ groupId, userId, body, replyToId }) => {
  await ensureSdgGroups();
  await ensureGroupExists(groupId);

  const sanitizedBody = sanitizeBody(body);
  if (!sanitizedBody) {
    throw new ApiError(400, 'Message body is required');
  }

  if (sanitizedBody.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, `Message body exceeds ${MAX_MESSAGE_LENGTH} characters`);
  }

  let replyMessage = null;
  if (replyToId) {
    replyMessage = await prisma.chatMessage.findUnique({
      where: { id: replyToId },
      select: { id: true, group_id: true }
    });
    if (!replyMessage || replyMessage.group_id !== groupId) {
      throw new ApiError(400, 'Reply target message not found in this group');
    }
  }

  const id = generateMessageId();

  const message = await prisma.chatMessage.create({
    data: {
      id,
      group_id: groupId,
      user_id: userId,
      body: sanitizedBody,
      reply_to_id: replyMessage ? replyMessage.id : null
    },
    include: {
      user: { select: { id: true, username: true, name: true } },
      reply_to: {
        select: {
          id: true,
          user: { select: { id: true, username: true, name: true } },
          body: true
        }
      }
    }
  });

  return message;
};

const listMessages = async (groupId, userId, { after, limit = 50 }) => {
  await ensureSdgGroups();
  await ensureGroupExists(groupId);

  const where = {
    group_id: groupId
  };

  if (after) {
    where.id = { gt: after };
  }

  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { id: 'asc' },
    take: limit,
    include: {
      user: { select: { id: true, username: true, name: true } },
      reply_to: {
        select: {
          id: true,
          user: { select: { id: true, username: true, name: true } },
          body: true
        }
      }
    }
  });

  return messages;
};

module.exports = {
  createMessage,
  listMessages
};
