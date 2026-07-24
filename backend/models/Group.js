const mongoose = require('mongoose');
const User = require('./User');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  lastMessage: { type: String, default: null },
  lastActivity: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false },
  isDepartmentGroup: { type: Boolean, default: false },
  department: { type: String, default: null },
});

// If this is a department group, auto‑populate members based on the department field.
groupSchema.pre('save', async function (next) {
  if (this.isDepartmentGroup && this.department) {
    try {
      const users = await User.find({ department: this.department }, '_id');
      this.members = users.map(u => u._id);
    } catch (err) {
      console.warn('Failed to auto‑populate department group members', err);
    }
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
