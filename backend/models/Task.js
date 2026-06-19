const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  title: String,
  description: String,
  priority: String,
  dueDate: String,
  status: String,
});

module.exports = mongoose.model("Task", taskSchema);