const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Audit", auditSchema);
