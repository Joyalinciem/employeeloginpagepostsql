const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const {
    registerUser,
    loginUser,
    getDashboard,
    setupMfa,
    verifyMfaSetup,
    sendEmailOtp,
    verifyMfa,
    disableMfa,
    getPendingUsers,
    approveUser,
    getUsers,
    updateUser,
    deleteUser,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/mfa/setup", authMiddleware, setupMfa);
router.post("/mfa/verify-setup", authMiddleware, verifyMfaSetup);
router.post("/mfa/send-email-otp", sendEmailOtp);
router.post("/mfa/verify", verifyMfa);
router.post("/mfa/disable", authMiddleware, disableMfa);
router.get("/dashboard", authMiddleware, getDashboard);

// Admin/CTO approval routes
router.get("/admin/pending", authMiddleware, requireRole(["admin", "cto"]), getPendingUsers);
router.post("/admin/approve/:id", authMiddleware, requireRole(["admin", "cto"]), approveUser);

// User management routes (role-based filtering enforced in controller)
router.get("/users", authMiddleware, getUsers);
router.put("/users/:id", authMiddleware, updateUser);
router.delete("/users/:id", authMiddleware, deleteUser);

module.exports = router;