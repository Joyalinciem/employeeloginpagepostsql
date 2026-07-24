const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // For group chats, name is required; for private chats, generated from participants.
  name: { type: String, required: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  isGroup: { type: Boolean, default: false },
  // Optional reference to a Group document if this chat is tied to a department group.
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
