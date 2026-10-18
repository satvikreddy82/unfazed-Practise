const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const notificationService = require('../services/notificationService');

/**
 * List conversations for current user
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const isTherapist = req.user.role === 'therapist';

    const filter = isTherapist ? { therapistId: userId } : { clientId: userId };

    const conversations = await Conversation.find(filter)
      .populate('therapistId', 'name email profileImage title')
      .populate('clientId', 'name email phone')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get or create a conversation between therapist and client
 */
exports.getOrCreateConversation = async (req, res) => {
  try {
    let therapistId, clientId;

    if (req.user.role === 'therapist') {
      therapistId = req.user.id;
      clientId = req.body.clientId;
    } else {
      therapistId = req.user.therapistId || req.body.therapistId;
      clientId = req.user.id;
    }

    if (!therapistId || !clientId) {
      return res.status(400).json({ success: false, message: 'Both therapistId and clientId are required.' });
    }

    let conversation = await Conversation.findOne({ therapistId, clientId })
      .populate('therapistId', 'name email profileImage title')
      .populate('clientId', 'name email phone');

    if (!conversation) {
      const therapist = await Therapist.findById(therapistId);
      const client = await Client.findById(clientId);

      if (!therapist || !client) {
        return res.status(404).json({ success: false, message: 'Participant not found.' });
      }

      conversation = await Conversation.create({
        therapistId,
        clientId,
        participants: [
          { userId: therapist._id, role: 'therapist', name: therapist.name, unreadCount: 0 },
          { userId: client._id, role: 'client', name: client.name, unreadCount: 0 },
        ],
        lastMessageText: 'Conversation started',
        lastMessageAt: new Date(),
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('therapistId', 'name email profileImage title')
        .populate('clientId', 'name email phone');
    }

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get messages in a conversation (strictly authorized)
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Verify participant
    const isParticipant =
      conversation.therapistId.toString() === req.user.id ||
      conversation.clientId.toString() === req.user.id;

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to conversation.' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(200);

    // Reset unread count for current user
    await Message.updateMany(
      { conversationId, recipientId: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Send a message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isTherapist = conversation.therapistId.toString() === req.user.id;
    const isClient = conversation.clientId.toString() === req.user.id;

    if (!isTherapist && !isClient) {
      return res.status(403).json({ success: false, message: 'Unauthorized sender.' });
    }

    const recipientId = isTherapist ? conversation.clientId : conversation.therapistId;

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user.id,
      senderRole: req.user.role,
      recipientId,
      text: text.trim(),
    });

    // Update conversation metadata
    conversation.lastMessageText = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit real-time message to socket room
    if (notificationService.io) {
      notificationService.io.to(`conversation_${conversationId}`).emit('new_message', message);
    }

    // In-app notification for recipient
    notificationService.notify({
      userId: recipientId,
      userRole: isTherapist ? 'client' : 'therapist',
      title: 'New Message',
      message: `${req.user.name}: ${text.trim().substring(0, 60)}${text.length > 60 ? '...' : ''}`,
      type: 'message',
      metadata: { conversationId: conversation._id },
    }).catch(console.error);

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
