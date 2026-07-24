const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getUserChats, getChatMessages, sendMessage } = require('../controllers/chatController');

// Get all chats for the authenticated user
router.get('/', authMiddleware, getUserChats);

// Get messages for a specific chat
router.get('/:chatId/messages', authMiddleware, getChatMessages);

// Send a new message (fallback for REST, but sockets are primary)
router.post('/:chatId/message', authMiddleware, sendMessage);

module.exports = router;
