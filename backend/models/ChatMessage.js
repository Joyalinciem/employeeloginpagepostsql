const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
    enum: ["user", "admin", "manager", "cto", "cfo", "bot"],
    default: "user",
  },
  messageType: {
    type: String,
    enum: ["private", "group", "department", "bot"],
    default: "private",
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null,
  },
  department: {
    type: String,
    default: null,
  },
  message: {
    type: String,
    required: true,
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatMessage",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
