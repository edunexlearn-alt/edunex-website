/* ============================================================
   AUTH ROUTES (server/routes/auth.js)
   POST /api/auth/register
   POST /api/auth/login
   POST /api/auth/logout
   GET  /api/auth/me
   PUT  /api/auth/change-password
   ============================================================ */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

/* ---- Register Student ---- */
router.post('/register', async (req, res) => {
    try {
        const { name, email, mobile, password, studentClass, parentName } = req.body;

        if (!name || !mobile || !password) {
            return res.status(400).json({ success: false, message: 'Name, mobile, and password are required.' });
        }

        // Check mobile uniqueness
        const exists = await User.findOne({ mobile });
        if (exists) {
            return res.status(409).json({ success: false, message: 'An account with this mobile number already exists.' });
        }

        const user = await User.create({
            name, email, mobile, password,
            studentClass, parentName,
            role: 'student'
        });

        const token = user.generateToken();
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        res.status(201).json({
            success: true,
            message: `Welcome to Edunex Academy, ${user.name}! 🎓`,
            token,
            user: user.toSafeObject()
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'Account already exists with this email or roll number.' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Login ---- */
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;  // identifier = email or mobile or rollNumber

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Identifier and password are required.' });
        }

        // Find by email, mobile, or rollNumber
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { mobile: identifier },
                { rollNumber: identifier.toUpperCase() }
            ]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
        }

        const token = user.generateToken();
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            token,
            user: user.toSafeObject()
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Get Current User ---- */
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('enrolledCourses.course', 'title category icon colorGradient');
        res.json({ success: true, user: user.toSafeObject() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Change Password ---- */
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both current and new password required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Update Profile ---- */
router.put('/profile', protect, async (req, res) => {
    try {
        const allowedFields = ['name', 'email', 'parentName', 'parentMobile', 'address', 'gender', 'dateOfBirth'];
        const updates = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({ success: true, message: 'Profile updated.', user: user.toSafeObject() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
