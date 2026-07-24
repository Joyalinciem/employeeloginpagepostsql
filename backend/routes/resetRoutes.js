const express = require("express");
const crypto = require("crypto");
const transporter = require("../config/mail");

const router = express.Router();

const resetTokens = {};

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email required",
    });
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Store OTP with expiry (15 minutes)
  const expiry = Date.now() + 15 * 60 * 1000;
  resetTokens[email] = { otp, expiry };

  const resetLink = `http://localhost:3000/reset-password/${otp}`;

  try {
    await transporter.sendMail({
      from: process.env.FROM_ADDRESS,
      to: email,
      subject: "Your OTP for Password Reset",
      html: `
        <h2>Your OTP</h2>
        <p>Use the following OTP to reset your password. It is valid for 15 minutes.</p>
        <p><strong>${otp}</strong></p>
        <p>Or click the link: <a href="${resetLink}">Reset Password</a></p>
      `,
    });
    // For development, include mock OTP in response
    const mockOtp = process.env.NODE_ENV === "development" ? otp : undefined;
    res.json({
      message: "OTP sent to your email. Valid for 15 minutes.",
      mockOtp,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Email sending failed",
    });
  }
});

module.exports = router;