const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    unique: true,
  },

  password: String,

  role: {
    type: String,
    enum: ["user", "admin", "manager", "cto"],
    default: "user",
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
    enum: ["email", "totp"],
    default: null,
  },

  // TOTP secret when using Google Authenticator
  mfaSecret: String,

  // Temporary secret used during TOTP setup until user verifies the first code
  mfaTempSecret: String,

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
});

module.exports = mongoose.model("User", userSchema);