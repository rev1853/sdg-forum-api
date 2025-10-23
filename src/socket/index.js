const { Server } = require('socket.io');
const prisma = require('../prisma');
const { verifyToken } = require('../services/jwtService');
const { createMessage } = require('../services/chatMessageService');
const { ensureActiveMember } = require('../services/chatGroupService');

const registerSocketEvents = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const decoded = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, username: true, name: true }
      });

      if (!user) {
        return next(new Error('Unauthorized'));
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
        await ensureActiveMember(groupId, user.id);
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

