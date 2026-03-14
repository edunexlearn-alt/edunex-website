/* ============================================================
   AUTH MIDDLEWARE (server/middleware/auth.js)
   ============================================================ */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/* ---- Protect: Require valid JWT ---- */
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }
        if (!req.user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

/* ---- Role-based Authorization ---- */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This route requires: [${roles.join(', ')}]`
            });
        }
        next();
    };
};

/* ---- Admin only shortcut ---- */
exports.adminOnly = [
    exports.protect,
    exports.authorize('admin')
];
