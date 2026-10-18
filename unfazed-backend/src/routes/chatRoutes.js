const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.get('/conversations', authenticate, chatController.getConversations);
router.post('/conversations', authenticate, chatController.getOrCreateConversation);
router.get('/messages/:conversationId', authenticate, chatController.getMessages);
router.post('/messages/:conversationId', authenticate, chatController.sendMessage);

module.exports = router;
