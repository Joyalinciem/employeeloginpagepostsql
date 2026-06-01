const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mail");
const { authenticator } = require("otplib");
const qrcode = require("qrcode");

const createMainToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });

const createTempMfaToken = (userId) =>
    jwt.sign({ userId, purpose: "mfa" }, process.env.JWT_SECRET, {
        expiresIn: "10m",
    });

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // New users require admin/CTO approval before they can log in
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            approved: false,
            role: "user",
        });

        res.status(201).json({
            message: "Registration successful. Pending admin approval",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login User (with MFA support)
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.approved) {
            return res.status(403).json({ message: "Account pending admin approval" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // If MFA not enabled, return regular token
        if (!user.mfaEnabled) {
            const token = createMainToken(user._id);
            return res.status(200).json({ message: "Login successful", token });
        }

        // MFA is enabled: create a short-lived temp token and require verification
        const tempToken = createTempMfaToken(user._id);

        if (user.mfaMethod === "email") {
            // generate and send email OTP
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = code;
            user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
            await user.save();

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: user.email,
                    subject: "Your login verification code",
                    text: `Your verification code is: ${code}`,
                });
            } catch (mailErr) {
                // don't leak internal mail error
                console.error("Mail error", mailErr);
            }

            return res.status(200).json({ mfaRequired: true, method: "email", tempToken });
        }

        // For TOTP (Authenticator App), client should prompt for code
        return res.status(200).json({ mfaRequired: true, method: "totp", tempToken });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Setup TOTP (Authenticator App) - generates QR code and temporary secret
exports.setupMfa = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const secret = authenticator.generateSecret();
        user.mfaTempSecret = secret;
        await user.save();

        const otpauth = authenticator.keyuri(user.email, process.env.APP_NAME || "MyApp", secret);
        const qr = await qrcode.toDataURL(otpauth);

        res.status(200).json({ qr });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify initial TOTP during setup and enable MFA
exports.verifyMfaSetup = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { token } = req.body; // TOTP code from authenticator app

        const user = await User.findById(userId);
        if (!user || !user.mfaTempSecret) return res.status(400).json({ message: "No TOTP setup in progress" });

        const valid = authenticator.check(token, user.mfaTempSecret);
        if (!valid) return res.status(400).json({ message: "Invalid token" });

        user.mfaSecret = user.mfaTempSecret;
        user.mfaTempSecret = null;
        user.mfaEnabled = true;
        user.mfaMethod = "totp";
        await user.save();

        res.status(200).json({ message: "TOTP setup complete" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send an email OTP (can be used to enable email MFA or for login verification)
exports.sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = code;
        user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: user.email,
            subject: "Your verification code",
            text: `Your verification code is: ${code}`,
        });

        res.status(200).json({ message: "OTP sent" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify MFA (after login) using temp token issued by loginUser
exports.verifyMfa = async (req, res) => {
    try {
        const { tempToken, code } = req.body;
        if (!tempToken) return res.status(400).json({ message: "Missing tempToken" });

        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: "Invalid or expired temp token" });
        }

        if (decoded.purpose !== "mfa") return res.status(400).json({ message: "Invalid token purpose" });

        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.mfaMethod === "email") {
            if (!user.otp || user.otpExpiry < Date.now()) return res.status(400).json({ message: "OTP expired or not found" });
            if (user.otp !== code) return res.status(400).json({ message: "Invalid OTP" });
            user.otp = null;
            user.otpExpiry = null;
            await user.save();
            const token = createMainToken(user._id);
            return res.status(200).json({ message: "Login successful", token });
        }

        // TOTP
        const valid = authenticator.check(code, user.mfaSecret);
        if (!valid) return res.status(400).json({ message: "Invalid token" });

        const token = createMainToken(user._id);
        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Disable MFA
exports.disableMfa = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.mfaEnabled = false;
        user.mfaMethod = null;
        user.mfaSecret = null;
        await user.save();

        res.status(200).json({ message: "MFA disabled" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Protected Dashboard
exports.getDashboard = async (req, res) => {
    res.status(200).json({
        message: "Welcome to dashboard",
        user: req.user,
    });
};

// Admin / CTO: list users pending approval
exports.getPendingUsers = async (req, res) => {
    try {
        const pending = await User.find({ approved: false }).select('-password -otp -mfaSecret -mfaTempSecret');
        res.status(200).json({ pending });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve a user (admin or cto)
exports.approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.approved = true;
        await user.save();

        res.status(200).json({ message: 'User approved', user: { id: user._id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get list of users manageable by the requester
exports.getUsers = async (req, res) => {
    try {
        const requesterRole = req.user.role;

        let filter = {};
        if (requesterRole === 'manager') {
            filter = { role: 'user' };
        } else if (requesterRole === 'cto') {
            filter = { role: { $in: ['user', 'manager'] } };
        } else if (requesterRole === 'admin') {
            filter = { role: 'user' };
        }

        const users = await User.find(filter).select('-password -otp -mfaSecret -mfaTempSecret');
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a user (name, role) with role-based restrictions
exports.updateUser = async (req, res) => {
    try {
        const requesterRole = req.user.role;
        const { id } = req.params;
        const { name, role } = req.body;

        const target = await User.findById(id);
        if (!target) return res.status(404).json({ message: 'User not found' });

        // Managers can only act on regular users
        if (requesterRole === 'manager') {
            if (target.role !== 'user') return res.status(403).json({ message: 'Forbidden' });
            if (role && role !== 'user') return res.status(403).json({ message: 'Managers cannot assign elevated roles' });
        }

        // CTO can act on users and managers but not other CTOs
        if (requesterRole === 'cto') {
            if (target.role === 'cto') return res.status(403).json({ message: 'Forbidden' });
            if (role && role === 'cto') return res.status(403).json({ message: 'Cannot assign CTO role' });
        }

        // Admin can act on users only
        if (requesterRole === 'admin') {
            if (target.role !== 'user') return res.status(403).json({ message: 'Forbidden' });
            if (role && role !== 'user') return res.status(403).json({ message: 'Admin cannot assign elevated roles' });
        }

        if (name) target.name = name;
        if (role) target.role = role;
        await target.save();

        res.status(200).json({ message: 'User updated', user: { id: target._id, name: target.name, role: target.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a user with role-based restrictions
exports.deleteUser = async (req, res) => {
    try {
        const requesterRole = req.user.role;
        const { id } = req.params;

        const target = await User.findById(id);
        if (!target) return res.status(404).json({ message: 'User not found' });

        if (requesterRole === 'manager') {
            if (target.role !== 'user') return res.status(403).json({ message: 'Forbidden' });
        }

        if (requesterRole === 'admin') {
            if (target.role !== 'user') return res.status(403).json({ message: 'Forbidden' });
        }

        if (requesterRole === 'cto') {
            if (target.role === 'cto') return res.status(403).json({ message: 'Forbidden' });
        }

        await target.remove();
        res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};