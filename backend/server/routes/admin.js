/* ============================================================
   ADMIN ROUTES (server/routes/admin.js)
   Dashboard stats, reports, student management
   ============================================================ */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Fee = require('../models/Fee');
const Enquiry = require('../models/Enquiry');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

/* ---- Dashboard Stats ---- */
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalStudents, activeStudents, totalCourses,
            totalEnquiries, newEnquiries,
            pendingFees, paidToday, totalFeeCollected,
            totalTests, recentStudents
        ] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'student', isActive: true }),
            Course.countDocuments({ isActive: true }),
            Enquiry.countDocuments(),
            Enquiry.countDocuments({ status: 'new' }),
            Fee.countDocuments({ status: { $in: ['pending', 'overdue'] } }),
            Fee.aggregate([
                { $match: { status: 'paid', paidAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
                { $group: { _id: null, total: { $sum: '$netAmount' } } }
            ]),
            Fee.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$netAmount' } } }
            ]),
            Test.countDocuments({ isActive: true }),
            User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(5)
                .select('name rollNumber studentClass joinDate feeStatus')
        ]);

        // Monthly fee collection (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyFees = await Fee.aggregate([
            { $match: { status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
                    total: { $sum: '$netAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Enquiry status breakdown
        const enquiryStats = await Enquiry.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    totalStudents,
                    activeStudents,
                    totalCourses,
                    totalEnquiries,
                    newEnquiries,
                    pendingFees,
                    paidToday: paidToday[0]?.total || 0,
                    totalFeeCollected: totalFeeCollected[0]?.total || 0,
                    totalTests
                },
                recentStudents,
                monthlyFees,
                enquiryStats
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Create Admin (first-time setup only) ---- */
router.post('/create-admin', async (req, res) => {
    try {
        const existing = await User.findOne({ role: 'admin' });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Admin already exists.' });
        }

        const admin = await User.create({
            name: req.body.name || 'Admin',
            email: req.body.email,
            mobile: req.body.mobile,
            password: req.body.password,
            role: 'admin',
            isVerified: true,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Admin created.',
            token: admin.generateToken()
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Get All Students ---- */
router.get('/students', async (req, res) => {
    try {
        const { page = 1, limit = 20, search, studentClass, feeStatus, isActive } = req.query;

        const filter = { role: 'student' };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search } },
                { rollNumber: { $regex: search, $options: 'i' } }
            ];
        }
        if (studentClass) filter.studentClass = studentClass;
        if (feeStatus) filter.feeStatus = feeStatus;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const total = await User.countDocuments(filter);
        const students = await User.find(filter)
            .populate('enrolledCourses.course', 'title')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select('-password -passwordResetToken');

        res.json({
            success: true,
            total, page: Number(page),
            totalPages: Math.ceil(total / limit),
            data: students
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Add Student ---- */
router.post('/students', async (req, res) => {
    try {
        const student = await User.create({ ...req.body, role: 'student' });
        res.status(201).json({ success: true, message: 'Student added.', data: student.toSafeObject() });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: 'Mobile/email already exists.' });
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Update Student ---- */
router.put('/students/:id', async (req, res) => {
    try {
        const student = await User.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        ).select('-password');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
        res.json({ success: true, message: 'Student updated.', data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Toggle Student Active ---- */
router.patch('/students/:id/toggle-active', async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student) return res.status(404).json({ success: false, message: 'Not found.' });
        student.isActive = !student.isActive;
        await student.save({ validateBeforeSave: false });
        res.json({ success: true, message: `Student ${student.isActive ? 'activated' : 'deactivated'}.`, isActive: student.isActive });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Enroll Student in Course ---- */
router.post('/students/:id/enroll', async (req, res) => {
    try {
        const { courseId } = req.body;
        const student = await User.findById(req.params.id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

        const already = student.enrolledCourses.find(e => e.course.toString() === courseId);
        if (already) return res.status(409).json({ success: false, message: 'Already enrolled.' });

        student.enrolledCourses.push({ course: courseId });
        await student.save({ validateBeforeSave: false });

        await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });

        res.json({ success: true, message: 'Student enrolled in course.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Fee Overview ---- */
router.get('/fees/summary', async (req, res) => {
    try {
        const summary = await Fee.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$netAmount' }
                }
            }
        ]);
        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Enquiries Overview ---- */
router.get('/enquiries/stats', async (req, res) => {
    try {
        const stats = await Enquiry.aggregate([
            {
                $facet: {
                    byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                    byCourse: [{ $group: { _id: '$courseInterest', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }],
                    bySource: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
                    recent: [{ $sort: { createdAt: -1 } }, { $limit: 10 }]
                }
            }
        ]);
        res.json({ success: true, data: stats[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
