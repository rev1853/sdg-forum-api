const { Server } = require('socket.io');
const prisma = require('../prisma');
const { createMessage } = require('../services/chatMessageService');
const { ensureGroupExists, ensureSdgGroups } = require('../services/chatGroupService');

const registerSocketEvents = (io) => {
  io.use(async (socket, next) => {
    try {
      const userId =
        socket.handshake.auth?.userId ||
        socket.handshake.query?.userId ||
        socket.handshake.headers?.['x-user-id'];

      if (!userId) {
        return next(new Error('User id required'));
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, name: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    socket.on('chat:join', async ({ groupId }, callback = () => {}) => {
      try {
        await ensureSdgGroups();
        await ensureGroupExists(groupId);
        socket.join(`group:${groupId}`);
        callback({ status: 'ok' });
      } catch (error) {
        callback({ status: 'error', message: error.message });
      }
    });

    socket.on(
      'chat:leave',
      async ({ groupId }, callback = () => {}) => {
        socket.leave(`group:${groupId}`);
        callback({ status: 'ok' });
      }
    );

    socket.on(
      'chat:send',
      async ({ groupId, body, replyToId }, callback = () => {}) => {
        try {
          const message = await createMessage({
            groupId,
            userId: user.id,
            body,
            replyToId
          });

          io.to(`group:${groupId}`).emit('chat:new-message', {
            id: message.id,
            group_id: message.group_id,
            user: message.user,
            body: message.body,
            reply_to: message.reply_to
              ? {
                  id: message.reply_to.id,
                  body: message.reply_to.body,
                  user: message.reply_to.user
                }
              : null,
            created_at: message.created_at
          });

          callback({ status: 'ok' });
        } catch (error) {
          callback({ status: 'error', message: error.message });
        }
      }
    );
  });
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*'
    }
  });

  registerSocketEvents(io);

  return io;
};

module.exports = {
  initSocket
};
