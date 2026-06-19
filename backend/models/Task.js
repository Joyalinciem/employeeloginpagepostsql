const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  ctoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  priority: {
    type: String,
    default: "low",
  },
  dueDate: {
    type: Date,
  },
  status: {
    type: String,
    default: "open",
  },
  thumbnail: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Task", taskSchema);