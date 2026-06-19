const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  canUpdateTasks: {
    type: Boolean,
    default: true,
  },
  canDeleteTasks: {
    type: Boolean,
    default: false,
  },
  canUpdateUsers: {
    type: Boolean,
    default: false,
  },
  canDeleteUsers: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Role", roleSchema);
