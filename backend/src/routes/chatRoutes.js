const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatControllerMongo');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get chat messages for a connection
router.get('/:connectionId', chatController.getChatMessages.bind(chatController));

// Send a message in a connection
router.post('/:connectionId', chatController.sendMessage.bind(chatController));

// Mark messages as read
router.put('/:connectionId/read', chatController.markAsRead.bind(chatController));

module.exports = router; 