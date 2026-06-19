const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin", "manager", "cto"],
    default: "user",
  },
  designation: {
    type: String,
    default: "",
  },
  approved: {
    type: Boolean,
    default: false,
  },

  // For email OTP based MFA
  otp: String,
  otpExpiry: Date,

  // MFA configuration
  mfaEnabled: {
    type: Boolean,
    default: false,
  },

  // 'email' | 'totp' (Google Authenticator)
  mfaMethod: {
    type: String,
    enum: ["email", "totp", null],
    default: null,
  },
  mfaSecret: String,
  mfaTempSecret: String,
  oldPassword: String,
  profilePicture: {
    type: String,
    default: "",
  },
  canUpdateTasks: {
    type: Boolean,
    default: false,
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
}, {
  timestamps: true,
});

module.exports = mongoose.model("User", userSchema);