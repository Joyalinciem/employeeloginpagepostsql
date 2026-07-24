// controllers/chatController.js
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { canChat } = require('../utils/chatPermissions');

/**
 * Get list of chats (private or group) for the authenticated user.
 */
async function getUserChats(req, res) {
  try {
    const userId = req.user.id;
    // Find chats where user is a participant
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name email role')
      .populate('group', 'name description department')
      .lean();
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
}

/**
 * Get messages for a specific chat (private or group).
 */
async function getChatMessages(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not a member of this chat' });
    }
    const messages = await ChatMessage.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email role')
      .lean();
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

/**
 * Send a new message via REST (fallback). Uses same permission checks as WebSocket.
 */
async function sendMessage(req, res) {
  try {
    const { chatId } = req.params;
    const { message, messageType } = req.body; // messageType: 'private' | 'group'
    const userId = req.user.id;
    const chat = await Chat.findById(chatId).populate('participants', 'role');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.participants.map(p => p._id.toString()).includes(userId)) {
      return res.status(403).json({ message: 'Not a member of this chat' });
    }
    // For private chats ensure role matrix permits communication with the other participant
    if (!chat.isGroup && chat.participants.length === 2) {
      const other = chat.participants.find(p => p._id.toString() !== userId);
      if (!canChat(req.user.role, other.role)) {
        return res.status(403).json({ message: 'Role not permitted to chat with this user' });
      }
    }
    const chatMessage = new ChatMessage({
      chat: chatId,
      sender: userId,
      senderName: req.user.name,
      senderRole: req.user.role,
      messageType: messageType || (chat.isGroup ? 'group' : 'private'),
      message,
    });
    await chatMessage.save();
    // Optionally broadcast via WS if connections exist (handled in socket layer)
    res.json(chatMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send message' });
  }
}

module.exports = { getUserChats, getChatMessages, sendMessage };
