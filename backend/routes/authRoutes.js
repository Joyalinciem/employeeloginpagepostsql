const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    registerUser,
    loginUser,
    getDashboard
} = require("../Controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/dashboard", authMiddleware, getDashboard);

module.exports = router;