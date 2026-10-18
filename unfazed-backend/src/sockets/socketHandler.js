const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const initSocketIO = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required for WebSocket connection'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'unfazed_production_super_secret_jwt_key_2026_dev_mode');
      socket.user = decoded; // { id, role, email }
      next();
    } catch (err) {
      return next(new Error('Invalid or expired socket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;

    // Join personal notification channel
    socket.join(`user_${userId}`);

    // Join a conversation room with server-side authorization check
    socket.on('join_conversation', async ({ conversationId }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ error: 'Conversation not found' });
          return;
        }

        // Authorize: sender must be either the therapist or client in this conversation
        const isParticipant =
          conversation.therapistId.toString() === userId ||
          conversation.clientId.toString() === userId ||
          userRole === 'admin';

        if (!isParticipant) {
          if (callback) callback({ error: 'Unauthorized: You are not a participant in this conversation' });
          return;
        }

        socket.join(`conversation_${conversationId}`);
        if (callback) callback({ success: true, room: `conversation_${conversationId}` });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // Leave a conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // Real-time typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Reset recipient unread count and mark messages
        await Message.updateMany(
          { conversationId, recipientId: userId, isRead: false },
          { $set: { isRead: true, readAt: new Date() } }
        );

        // Notify other participant that messages were read
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: userId,
          readAt: new Date(),
        });
      } catch (err) {
        console.error('[Socket Read Error]:', err.message);
      }
    });

    socket.on('disconnect', () => {
      // Clean up
    });
  });
};

module.exports = initSocketIO;
