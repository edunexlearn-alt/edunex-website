/* ============================================================
   STUDENTS ROUTES (server/routes/students.js)
   Student self-service: dashboard, courses, test history
   ============================================================ */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Fee = require('../models/Fee');
const TestAttempt = require('../models/TestAttempt');
const { protect, authorize } = require('../middleware/auth');

/* ---- Student Dashboard ---- */
router.get('/dashboard', protect, authorize('student'), async (req, res) => {
    try {
        const student = await User.findById(req.user._id)
            .populate('enrolledCourses.course', 'title category icon colorGradient monthlyFee');

        // Pending fees
        const pendingFees = await Fee.find({
            student: req.user._id,
            status: { $in: ['pending', 'overdue'] }
        }).populate('course', 'title');

        // Recent test results
        const recentTests = await TestAttempt.find({ student: req.user._id, status: 'submitted' })
            .populate('test', 'title subject')
            .sort({ submittedAt: -1 })
            .limit(5);

        // Total paid fees this year
        const currentYear = new Date().getFullYear();
        const totalPaid = await Fee.aggregate([
            {
                $match: {
                    student: req.user._id,
                    status: 'paid',
                    paidAt: { $gte: new Date(`${currentYear}-01-01`) }
                }
            },
            { $group: { _id: null, total: { $sum: '$netAmount' } } }
        ]);

        res.json({
            success: true,
            data: {
                profile: student.toSafeObject(),
                enrolledCourses: student.enrolledCourses,
                pendingFees,
                recentTests,
                totalPaidThisYear: totalPaid[0]?.total || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Student Fee History ---- */
router.get('/fees', protect, authorize('student'), async (req, res) => {
    try {
        const fees = await Fee.find({ student: req.user._id })
            .populate('course', 'title')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: fees });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Student Test History ---- */
router.get('/tests/history', protect, authorize('student'), async (req, res) => {
    try {
        const attempts = await TestAttempt.find({ student: req.user._id })
            .populate('test', 'title subject type totalMarks Duration')
            .sort({ submittedAt: -1 });
        res.json({ success: true, data: attempts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
