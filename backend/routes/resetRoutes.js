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

  const token = crypto.randomBytes(32).toString("hex");

  resetTokens[email] = token;

  const resetLink = `http://localhost:5173/reset-password/${token}`;

  try {
    await transporter.sendMail({
      from: process.env.FROM_ADDRESS,
      to: email,
      subject: "Password Reset",
      html: `
        <h2>Password Reset</h2>
        <p>Click below to reset password:</p>
        <a href="${resetLink}">
          Reset Password
        </a>
      `,
    });

    res.json({
      message: "Password reset email sent",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Email sending failed",
    });
  }
});

module.exports = router;