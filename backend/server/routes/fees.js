/* ============================================================
   FEES ROUTES (server/routes/fees.js)
   ============================================================ */
const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

/* ---- Admin: Get All Fees ---- */
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, page = 1, limit = 20, month } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (month) filter.month = { $regex: month, $options: 'i' };

        const total = await Fee.countDocuments(filter);
        const fees = await Fee.find(filter)
            .populate('student', 'name rollNumber mobile studentClass')
            .populate('course', 'title')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ success: true, total, totalPages: Math.ceil(total / limit), data: fees });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Create Fee Record ---- */
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const fee = await Fee.create({ ...req.body, collectedBy: req.user._id });
        // Update student's fee status
        await User.findByIdAndUpdate(req.body.student, { feeStatus: 'pending' });
        res.status(201).json({ success: true, message: 'Fee record created.', data: fee });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Mark Fee as Paid ---- */
router.patch('/:id/mark-paid', protect, authorize('admin'), async (req, res) => {
    try {
        const { paymentMethod, transactionId, paidAmount } = req.body;
        const fee = await Fee.findById(req.params.id);
        if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });

        fee.paidAmount = paidAmount || fee.netAmount;
        fee.paymentMethod = paymentMethod || 'cash';
        fee.transactionId = transactionId;
        fee.paidAt = new Date();
        fee.collectedBy = req.user._id;
        await fee.save();

        // Update student fee status
        const pendingFees = await Fee.countDocuments({ student: fee.student, status: { $in: ['pending', 'overdue'] } });
        await User.findByIdAndUpdate(fee.student, { feeStatus: pendingFees > 0 ? 'pending' : 'paid' });

        res.json({ success: true, message: 'Fee marked as paid.', data: fee });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Generate Monthly Fees for All Active Students ---- */
router.post('/generate-monthly', protect, authorize('admin'), async (req, res) => {
    try {
        const { month, dueDate } = req.body;
        if (!month || !dueDate) return res.status(400).json({ success: false, message: 'Month and dueDate required.' });

        const students = await User.find({ role: 'student', isActive: true })
            .populate('enrolledCourses.course', 'monthlyFee title');

        let created = 0;
        for (const student of students) {
            for (const enrollment of student.enrolledCourses) {
                if (enrollment.status !== 'active' || !enrollment.course) continue;
                const existing = await Fee.findOne({ student: student._id, course: enrollment.course._id, month });
                if (existing) continue;

                await Fee.create({
                    student: student._id,
                    course: enrollment.course._id,
                    feeType: 'monthly',
                    amount: enrollment.course.monthlyFee,
                    month,
                    dueDate: new Date(dueDate),
                    collectedBy: req.user._id
                });
                created++;
            }
        }

        res.json({ success: true, message: `${created} fee records generated for ${month}.` });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
