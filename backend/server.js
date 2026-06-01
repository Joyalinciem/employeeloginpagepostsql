const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { generateSecret, verify } = require('otplib');
const { generateTOTP } = require('@otplib/uri');
const { crypto } = require('@otplib/plugin-crypto-noble');
const { base32 } = require('@otplib/plugin-base32-scure');
const QRCode = require("qrcode");

dotenv.config();

const path = require('path');
const app = express();
app.use(cors());
const frontendPath = path.resolve(__dirname, '..', 'frontend');
console.log('🔧 Frontend path resolved to:', frontendPath);
app.use(express.json());
// Serve static frontend files
app.use(express.static(frontendPath));
app.get('/mfa_demo.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'mfa_demo.html'));
});
app.get('/mfa_demo.html', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'frontend', 'mfa_demo.html'));
});
// =====================================
// MongoDB Connection
// =====================================

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/taskmanager")

// =====================================
// User Schema
// =====================================

const userSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    unique: true,
  },

  password: String,

  role: {
    type: String,
    enum: ["user", "manager", "cto", "admin"],
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

  otp: String,

  otpExpiry: Date,

  mfaEnabled: {
    type: Boolean,
    default: false,
  },

  mfaMethod: {
    type: String,
    enum: ["none", "email", "totp"],
    default: "none",
  },

  mfaSecret: {
    type: String,
    default: "",
  },

  canUpdateTasks: {
    type: Boolean,
    default: true,
  },

  canDeleteTasks: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const User = mongoose.model("User", userSchema);

// =====================================
// Task Schema
// =====================================

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // Links to organizational hierarchy
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

const Task = mongoose.model("Task", taskSchema);

// =====================================
// Assignment Audit Schema
// =====================================
const auditSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String }, // e.g., 'assign-manager', 'unassign-manager', 'assign-cto'
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: Object, default: {} },
}, { timestamps: true });

const Audit = mongoose.model('Audit', auditSchema);

// =====================================
// Mail Transporter
// =====================================

let transporter;
if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST.includes('example')) {
  // Development fallback: log emails to console
  transporter = {
    sendMail: async (options) => {
      console.log('✉️  Mock email sent:', options);
      return Promise.resolve();
    },
  };
} else {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const sendDecisionEmail = async (user, accepted) => {
  const subject = accepted
    ? "Your account has been approved"
    : "Your account request has been rejected";

  const text = accepted
    ? `Hello ${user.name},\n\nYour account has been approved by the administrator. You can now log in using your registered email address.\n\nBest regards,\nTeam`
    : `Hello ${user.name},\n\nYour account request has been rejected by the administrator. If you believe this is a mistake, please contact the support team.\n\nBest regards,\nTeam`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@example.com',
      to: user.email,
      subject,
      text,
    });
  } catch (mailError) {
    console.error('Failed to send decision email:', mailError);
  }
};

// =====================================
// JWT Middleware
// =====================================

const authMiddleware = async (req, res, next) => {
  // Extract token from Authorization header (Bearer <token>) or query string.
  const token =
    req.headers.authorization?.split(' ')[1] ||
    req.headers.authorization ||
    req.query.token;

  console.log('AUTH MIDDLEWARE TOKEN:', token);

  if (!token) {
    return res.status(401).json({
      message: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log('AUTH DECODED:', decoded);

    const user = await User.findById(decoded.id);

    console.log('AUTH USER FOUND:', !!user, user?._id?.toString());

    if (!user) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    req.user = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      designation: user.designation || "",
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod,
      canUpdateTasks: user.canUpdateTasks,
      canDeleteTasks: user.canDeleteTasks,
      canUpdateUsers: user.canUpdateUsers,
      canDeleteUsers: user.canDeleteUsers,
    };

    next();
  } catch (error) {
    console.log('AUTH ERROR', error.message);
    return res.status(401).json({
      message: "Invalid token",
      error: error.message,
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};

// =====================================
// Home Route
// =====================================

app.get("/", (req, res) => {
  res.send("Server Running...");
});

// =====================================
// Register
// =====================================

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.json({
        message: "User already exists",
      });
    }

    const allowedRoles = ["user", "manager", "cto"];
    const requestedRole = allowedRoles.includes(role) ? role : "user";

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const existingUserCount = await User.countDocuments();

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: existingUserCount === 0 ? "admin" : requestedRole,
      approved: existingUserCount === 0 ? true : false,
    });

    await user.save();

    res.json({
      message:
        existingUserCount === 0
          ? "Registration successful. First admin account created."
          : "Registration successful. Pending admin approval. You will receive an email once approved.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

// =====================================
// Login
// =====================================
// This endpoint authenticates user credentials.
// If MFA is enabled for the user, it responds with { requiresMFA: true, mfaMethod: "email" | "totp" }.
// The client must then call /api/verify-mfa with the received OTP (email) or TOTP code (Google Authenticator).
// Upon successful verification, a JWT token is returned.

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.json({
        message: "Invalid credentials",
      });
    }

    // Allow the first admin to log in if no approved admin exists yet.
    const approvedAdminExists = await User.exists({ role: "admin", approved: true });
    if (!user.approved && !(user.role === "admin" && !approvedAdminExists)) {
      return res.status(403).json({ message: "Account pending admin approval" });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.json({
        message: "Invalid credentials",
      });
    }

    if (user.mfaEnabled) {
      if (user.mfaMethod === "email") {
        const otp = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

        user.otp = otp;
        user.otpExpiry = expiryTime;
        await user.save();

        console.log('📧 MFA login OTP generated', { email, otp, expiryTime });

        await transporter.sendMail({
          from: process.env.FROM_ADDRESS,
          to: email,
          subject: "MFA Verification Code",
          html: `
            <div style="
              font-family:Arial;
              padding:25px;
              background:#f5f5f5;
            ">
              <div style="
                background:white;
                padding:30px;
                border-radius:10px;
              ">
                <h2 style="color:#0072ff;">
                  MFA Verification Code
                </h2>

                <p>
                  Use the following verification code to complete your login:
                </p>

                <h1 style="
                  color:#ff512f;
                  letter-spacing:6px;
                  text-align:center;
                ">
                  ${otp}
                </h1>

                <p style="
                  color:red;
                  font-weight:bold;
                ">
                  This verification code is valid only for 5 minutes.
                </p>
              </div>
            </div>
          `,
        });

        return res.json({
          requiresMFA: true,
          mfaMethod: "email",
          email: user.email,
        });
      } else if (user.mfaMethod === "totp") {
        return res.json({
          requiresMFA: true,
          mfaMethod: "totp",
          email: user.email,
        });
      }
    }

    const token = jwt.sign(
      {
        id: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

// =====================================
// Profile
// =====================================

app.get(
  "/api/profile",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("PROFILE REQ USER", req.user);
      res.json(req.user);
    } catch (error) {
      console.log("PROFILE ERROR", error);
      res.status(500).json({
        message: "Failed to get profile",
        error: error.message,
      });
    }
  }
);

// Admin: fetch recent assignment audit logs
app.get('/api/admin/assignment-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    const skip = (page - 1) * limit;
    const total = await Audit.countDocuments();
    const logs = await Audit.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name email role')
      .populate('targetId', 'name email role');

    res.json({ logs, page, limit, total });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to fetch assignment logs' });
  }
});

// Export assignment logs as CSV (admin only)
app.get('/api/admin/assignment-logs/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await Audit.find().sort({ createdAt: -1 }).populate('actorId', 'name email role').populate('targetId', 'name email role');
    // Build CSV
    const header = ['timestamp', 'action', 'actor_email', 'actor_name', 'target_email', 'target_name', 'details'];
    const rows = logs.map(l => [
      l.createdAt.toISOString(),
      l.action,
      l.actorId?.email || '',
      l.actorId?.name || '',
      l.targetId?.email || '',
      l.targetId?.name || '',
      JSON.stringify(l.details || {})
    ]);

    const csv = [header.join(','), ...rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="assignment-logs.csv"');
    res.send(csv);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to export assignment logs' });
  }
});

// =====================================
// MFA Routes
// =====================================
// Email MFA: Generates a 6‑digit OTP, stores it on the user record, and sends it via email.
// TOTP (Google Authenticator): Uses otplib's TOTP implementation. The secret is generated during setup and stored on the user.
// Verify MFA (both methods) is handled by /api/verify-mfa.
// The endpoint validates the provided code and returns a JWT on success.

app.post("/api/verify-mfa", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    console.log('🔍 verify-mfa request', { email, code, userId: user ? user._id : null });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.mfaEnabled) {
      return res.status(400).json({ message: "MFA is not enabled for this user" });
    }

    if (user.mfaMethod === "email") {
      console.log('📧 Email MFA check', { storedOtp: user.otp, receivedCode: code, expiry: user.otpExpiry });
      if (user.otp !== code) {
        return res.json({ message: "Invalid verification code" });
      }
      if (Date.now() > user.otpExpiry) {
        return res.json({ message: "Verification code expired. Please log in again." });
      }
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
    } else if (user.mfaMethod === "totp") {
      console.log('🔐 TOTP verification', { secret: user.mfaSecret, token: code });
      const isValid = await verify({ token: code, secret: user.mfaSecret, crypto, base32 });
      if (!isValid) {
        return res.json({ message: "Invalid Authenticator App code" });
      }
    } else {
      return res.status(400).json({ message: "Invalid MFA method" });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "MFA verification failed" });
  }
});

app.post("/api/mfa/setup", authMiddleware, async (req, res) => {
  try {
    const { method } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (method === "email") {
      const otp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

      user.otp = otp;
      user.otpExpiry = expiryTime;
      await user.save();

      console.log('📧 MFA setup OTP (email) generated', { email: user.email, otp, expiryTime });

      await transporter.sendMail({
        from: process.env.FROM_ADDRESS,
        to: user.email,
        subject: "MFA Setup Verification Code",
        html: `
          <div style="
            font-family:Arial;
            padding:25px;
            background:#f5f5f5;
          ">
            <div style="
              background:white;
              padding:30px;
              border-radius:10px;
            ">
              <h2 style="color:#0072ff;">
                MFA Setup
              </h2>
              <p>
                Use the following verification code to enable Email MFA:
              </p>
              <h1 style="
                color:#ff512f;
                letter-spacing:6px;
                text-align:center;
              ">
                ${otp}
              </h1>
              <p style="
                color:red;
                font-weight:bold;
              ">
                This verification code is valid only for 5 minutes.
              </p>
            </div>
          </div>
        `,
      });

      res.json({ message: "Verification code sent to your email" });
    } else if (method === "totp") {
      const secret = generateSecret({ crypto, base32 });
      console.log('🔐 Generated TOTP secret for setup', { email: user.email, secret });
      user.mfaSecret = secret;
      await user.save();

      const otpauth = generateTOTP({ issuer: "TaskManager", label: user.email, secret });
      const qrCodeUrl = await QRCode.toDataURL(otpauth);

      res.json({ secret, qrCodeUrl });
    } else {
      res.status(400).json({ message: "Invalid setup method" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "MFA setup failed" });
  }
});

app.post("/api/mfa/verify-setup", authMiddleware, async (req, res) => {
  try {
    const { method, code } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (method === "email") {
      if (user.otp !== code) {
        return res.json({ message: "Invalid verification code" });
      }
      if (Date.now() > user.otpExpiry) {
        return res.json({ message: "Verification code expired. Please try setup again." });
      }

      user.mfaEnabled = true;
      user.mfaMethod = "email";
      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      res.json({ message: "Email MFA enabled successfully" });
    } else if (method === "totp") {
      const isValid = await verify({ token: code, secret: user.mfaSecret, crypto, base32 });

      if (!isValid) {
        return res.json({ message: "Invalid Authenticator App code" });
      }

      user.mfaEnabled = true;
      user.mfaMethod = "totp";
      await user.save();

      res.json({ message: "Authenticator App MFA enabled successfully" });
    } else {
      res.status(400).json({ message: "Invalid verification method" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "MFA verification failed" });
  }
});

app.get("/api/mfa/status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch MFA status" });
  }
});

app.post("/api/mfa/disable", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.mfaEnabled = false;
    user.mfaMethod = "none";
    user.mfaSecret = "";
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "MFA disabled successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to disable MFA" });
  }
});


// =====================================
// =====================================
// Forgot Password - 15 Minute OTP
// =====================================

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.json({
        message: "User not found",
      });
    }

    // GENERATE 6 DIGIT OTP

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP VALID FOR 15 MINUTES

    const expiryTime =
      Date.now() + 15 * 60 * 1000;

    user.otp = otp;

    user.otpExpiry = expiryTime;

    await user.save();

    console.log("Generated OTP:", otp);

    // SEND EMAIL

    await transporter.sendMail({
      from: process.env.FROM_ADDRESS,

      to: email,

      subject: "Password Reset OTP",

      html: `
        <div style="
          font-family:Arial;
          padding:25px;
          background:#f5f5f5;
        ">
          <div style="
            background:white;
            padding:30px;
            border-radius:10px;
          ">
            <h2 style="color:#0072ff;">
              Password Reset OTP
            </h2>

            <p>
              Use the following OTP to reset your password:
            </p>

            <h1 style="
              color:#ff512f;
              letter-spacing:6px;
              text-align:center;
            ">
              ${otp}
            </h1>

            <p style="
              color:red;
              font-weight:bold;
            ">
              This OTP is valid only for 15 minutes.
            </p>

            <p>
              After 15 minutes the OTP expires automatically.
            </p>

            <p>
              If OTP expires, you must click
              <b>Send OTP</b> again.
            </p>
          </div>
        </div>
      `,
    });

    res.json({
      message:
        "OTP sent successfully. OTP valid for 15 minutes.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});


// =====================================
// =====================================
// Verify OTP
// =====================================

app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.json({
        message: "User not found",
      });
    }

    // CHECK OTP

    if (user.otp !== otp) {
      return res.json({
        message: "Invalid OTP",
      });
    }

    // CHECK EXPIRY

    if (Date.now() > user.otpExpiry) {
      return res.json({
        message:
          "OTP expired. Please click Send OTP again.",
      });
    }

    res.json({
      message:
        "OTP verified successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message:
        "OTP verification failed",
    });
  }
});

// =====================================
// Reset Password
// =====================================

app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, newPassword } =
      req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.json({
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    user.password = hashedPassword;

    user.otp = null;

    user.otpExpiry = null;

    await user.save();

    res.json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Password reset failed",
    });
  }
});

// =====================================
// Add Task
// =====================================

app.post(
  "/api/tasks",
  authMiddleware,
  async (req, res) => {
    try {
      const task = new Task({
        userId: req.user.id,

        title: req.body.title,

        description:
          req.body.description,

        priority: req.body.priority,

        dueDate: req.body.dueDate,

        status: req.body.status,

        thumbnail: req.body.thumbnail,
      });

      await task.save();

      res.json(task);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to add task",
      });
    }
  }
);

// =====================================
// Get Tasks
// =====================================

app.get(
  "/api/tasks",
  authMiddleware,
  async (req, res) => {
    try {
      let tasks;

      if (req.user.role === "admin") {
        tasks = await Task.find().populate(
          "userId",
          "name email"
        );
      } else {
        tasks = await Task.find({
          userId: req.user.id,
        }).populate("userId", "name email");
      }

      res.json(tasks);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to fetch tasks",
      });
    }
  }
);

app.get(
  "/api/admin/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const users = await User.find().select(
        "name email role designation canUpdateTasks canDeleteTasks canUpdateUsers canDeleteUsers approved"
      );

      res.json(users);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to fetch users",
      });
    }
  }
);

app.get(
  "/api/admin/pending-requests",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // Admin-only pending requests (exclude admin role creations)
      const pending = await User.find({ approved: false, role: { $ne: "admin" } }).select("name email role managerId ctoId createdAt");
      res.json(pending);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  }
);

app.post(
  "/api/admin/pending-requests/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const pendingUser = await User.findById(req.params.id);
      if (!pendingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (pendingUser.approved) {
        return res.status(400).json({ message: "User is already approved" });
      }

      pendingUser.approved = true;
      await pendingUser.save();

      await sendDecisionEmail(pendingUser, true);

      res.json({ message: "User approved" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  }
);

app.post(
  "/api/admin/pending-requests/:id/reject",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const pendingUser = await User.findById(req.params.id);
      if (!pendingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (pendingUser.approved) {
        return res.status(400).json({ message: "Approved users cannot be rejected" });
      }

      await sendDecisionEmail(pendingUser, false);
      await pendingUser.deleteOne();

      res.json({ message: "User rejected and notification sent" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  }
);

// List users based on requester role: manager -> users only, cto -> users and managers, admin -> users
app.get(
  "/api/users",
  authMiddleware,
  async (req, res) => {
    try {
      let filter = {};
      if (req.user.role === "manager") {
        filter = { role: "user" };
      } else if (req.user.role === "cto") {
        filter = { role: { $in: ["user", "manager"] } };
      } else if (req.user.role === "admin") {
        filter = {}; // admin sees all users
      }

      const users = await User.find(filter).select(
        "name email role managerId ctoId canUpdateTasks canDeleteTasks approved"
      );

      res.json(users);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
);



app.get(
  "/api/admin/tasks",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const tasks = await Task.find()
        .populate("userId", "name email role")
        .sort({ createdAt: -1 });

      res.json(tasks);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to fetch tasks",
      });
    }
  }
);

// =====================================
// Update User Permissions (Admin Only)
// =====================================

app.put(
  "/api/admin/users/:id/permissions",
  authMiddleware,
  async (req, res) => {
    try {
      const { canUpdateTasks, canDeleteTasks, canUpdateUsers, canDeleteUsers } = req.body;
      const target = await User.findById(req.params.id);
      if (!target) return res.status(404).json({ message: "User not found" });

      const requesterRole = req.user.role;

      // Admin can change any permission
      if (requesterRole === "admin") {
        if (canUpdateTasks !== undefined) target.canUpdateTasks = canUpdateTasks;
        if (canDeleteTasks !== undefined) target.canDeleteTasks = canDeleteTasks;
        if (canUpdateUsers !== undefined) target.canUpdateUsers = canUpdateUsers;
        if (canDeleteUsers !== undefined) target.canDeleteUsers = canDeleteUsers;
      } else if (requesterRole === "cto") {
        // CTO can modify task permissions for users and managers
        if (!["user", "manager"].includes(target.role)) {
          return res.status(403).json({ message: "CTO can only modify users and managers" });
        }
        if (canUpdateTasks !== undefined) target.canUpdateTasks = canUpdateTasks;
        if (canDeleteTasks !== undefined) target.canDeleteTasks = canDeleteTasks;
      } else if (requesterRole === "manager") {
        // Manager can modify task permissions for users only
        if (target.role !== "user") {
          return res.status(403).json({ message: "Manager can only modify users" });
        }
        if (canUpdateTasks !== undefined) target.canUpdateTasks = canUpdateTasks;
        if (canDeleteTasks !== undefined) target.canDeleteTasks = canDeleteTasks;
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }

      await target.save();

      res.json({ message: "Permissions updated successfully", user: target });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to update permissions" });
    }
  }
);

// Admin: assign a manager to a user
app.put(
  "/api/admin/users/:id/assign-manager",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { managerId } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Unassign manager when managerId is null or empty
      if (!managerId) {
        user.managerId = null;
        await user.save();
        await Audit.create({ actorId: req.user.id, action: 'unassign-manager', targetId: user._id, details: { previousManager: user.managerId } });
        return res.json({ message: "Manager unassigned", user });
      }

      const manager = await User.findById(managerId);
      if (!manager || manager.role !== "manager") return res.status(400).json({ message: "Manager not found" });

      const prev = user.managerId;
      user.managerId = manager._id;
      await user.save();
      await Audit.create({ actorId: req.user.id, action: 'assign-manager', targetId: user._id, details: { managerId: manager._id, previousManager: prev } });

      res.json({ message: "Manager assigned", user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to assign manager" });
    }
  }
);

// Admin: assign a CTO to a manager
app.put(
  "/api/admin/users/:id/assign-cto",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { ctoId } = req.body;
      const manager = await User.findById(req.params.id);
      if (!manager) return res.status(404).json({ message: "User not found" });
      if (manager.role !== "manager") return res.status(400).json({ message: "Target is not a manager" });

      // Unassign CTO when ctoId is null or empty
      if (!ctoId) {
        const prev = manager.ctoId;
        manager.ctoId = null;
        await manager.save();
        await Audit.create({ actorId: req.user.id, action: 'unassign-cto', targetId: manager._id, details: { previousCto: prev } });
        return res.json({ message: "CTO unassigned from manager", manager });
      }

      const cto = await User.findById(ctoId);
      if (!cto || cto.role !== "cto") return res.status(400).json({ message: "CTO not found" });

      const prevcto = manager.ctoId;
      manager.ctoId = cto._id;
      await manager.save();
      await Audit.create({ actorId: req.user.id, action: 'assign-cto', targetId: manager._id, details: { ctoId: cto._id, previousCto: prevcto } });

      res.json({ message: "CTO assigned to manager", manager });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to assign CTO" });
    }
  }
);

// =====================================
// Update Task
// =====================================

app.put(
  "/api/tasks/:id",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin" && !req.user.canUpdateTasks) {
        return res.status(403).json({
          message: "You do not have permission to update tasks. Contact your administrator.",
        });
      }

      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      if (
        task.userId.toString() !==
        req.user.id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message: "Not authorized to update this task",
        });
      }

      if (req.body.title !== undefined) task.title = req.body.title;
      if (req.body.description !== undefined) task.description = req.body.description;
      if (req.body.priority !== undefined) task.priority = req.body.priority;
      if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
      if (req.body.status !== undefined) task.status = req.body.status;
      if (req.body.thumbnail !== undefined) task.thumbnail = req.body.thumbnail;

      await task.save();

      res.json(task);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to update task",
      });
    }
  }
);

// =====================================
// Update User (Admin or delegated user update access)
// =====================================

app.put(
  "/api/users/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }
      // Role-based restrictions
      if (req.user.role === "manager") {
        if (targetUser.role !== "user") {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (req.body.role && req.body.role !== "user") {
          return res.status(403).json({ message: "Managers cannot assign elevated roles" });
        }
      }

      if (req.user.role === "cto") {
        if (targetUser.role === "cto") {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (req.body.role && req.body.role === "cto") {
          return res.status(403).json({ message: "Cannot assign CTO role" });
        }
      }

      if (req.user.role === "admin") {
        if (targetUser.role !== "user") {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (req.body.role && req.body.role !== "user") {
          return res.status(403).json({ message: "Admin cannot assign elevated roles" });
        }
      }

      if (req.body.name !== undefined) targetUser.name = req.body.name;
      if (req.body.email !== undefined) targetUser.email = req.body.email;
      if (req.body.role !== undefined) targetUser.role = req.body.role;

      await targetUser.save();

      res.json({
        message: "User updated successfully",
        user: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          canUpdateTasks: targetUser.canUpdateTasks,
          canDeleteTasks: targetUser.canDeleteTasks,
          canUpdateUsers: targetUser.canUpdateUsers,
          canDeleteUsers: targetUser.canDeleteUsers,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to update user",
      });
    }
  }
);

// =====================================
// Delete User (Admin or delegated user delete access)
// =====================================

app.delete(
  "/api/users/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (targetUser.role === "admin" && req.user.role !== "admin") {
        return res.status(403).json({
          message: "Only admins can delete admin accounts.",
        });
      }

          // Role-based restrictions for deletion
          if (req.user.role === "manager") {
            if (targetUser.role !== "user") return res.status(403).json({ message: "Forbidden" });
          }

          if (req.user.role === "cto") {
            if (targetUser.role === "cto") return res.status(403).json({ message: "Forbidden" });
          }

          if (
            req.user.role !== "admin" &&
            !req.user.canDeleteUsers &&
            req.user.id.toString() !== targetUser._id.toString()
          ) {
            return res.status(403).json({
              message: "You do not have permission to delete users. Contact your administrator.",
            });
          }

      await User.findByIdAndDelete(req.params.id);

      res.json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to delete user",
      });
    }
  }
);

// =====================================
// Delete Task
// =====================================

app.delete(
  "/api/tasks/:id",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin" && !req.user.canDeleteTasks) {
        return res.status(403).json({
          message: "You do not have permission to delete tasks. Contact your administrator.",
        });
      }

      const task = await Task.findById(
        req.params.id
      );

      if (!task) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      if (
        task.userId.toString() !==
        req.user.id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message: "Not authorized to delete this task",
        });
      }

      await Task.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message: "Task deleted",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Delete failed",
      });
    }
  }
);

// =====================================
// Start Server
// =====================================

app.get("/test-mail", async (req, res) => {
  console.log("TEST MAIL ROUTE HIT");

  try {
    await transporter.sendMail({
      from: process.env.FROM_ADDRESS,

      to: "majortest007@gmail.com",

      subject: "Test Mail",

      html: "<h1>SMTP Working</h1>",
    });

    res.send("Mail Sent Successfully");
  } catch (error) {
    console.log(error);

    res.send("Mail Failed");
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});