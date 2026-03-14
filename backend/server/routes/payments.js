/* ============================================================
   PAYMENTS ROUTES (server/routes/payments.js)
   Razorpay Fee Payment Integration
   ============================================================ */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Fee = require('../models/Fee');
const { protect, authorize } = require('../middleware/auth');

/* ---- Create Razorpay Order ---- */
router.post('/create-order', protect, authorize('student', 'admin'), async (req, res) => {
    try {
        const { feeId } = req.body;

        const fee = await Fee.findById(feeId).populate('student', 'name mobile email');
        if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });
        if (fee.status === 'paid') return res.status(400).json({ success: false, message: 'This fee is already paid.' });

        // Check if Razorpay keys are configured
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('your_')) {
            // Demo mode — return a mock order
            return res.json({
                success: true,
                demo: true,
                message: 'Razorpay is in demo mode. Configure keys in .env',
                order: {
                    id: `demo_order_${Date.now()}`,
                    amount: fee.netAmount * 100,
                    currency: 'INR',
                    receipt: feeId
                },
                key: 'rzp_test_demo',
                prefill: {
                    name: fee.student.name,
                    contact: fee.student.mobile,
                    email: fee.student.email || ''
                }
            });
        }

        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const order = await razorpay.orders.create({
            amount: Math.round(fee.netAmount * 100),    // paise
            currency: 'INR',
            receipt: feeId,
            notes: { feeId, studentId: fee.student._id.toString() }
        });

        // Save order ID
        fee.razorpayOrderId = order.id;
        await fee.save({ validateBeforeSave: false });

        res.json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID,
            prefill: {
                name: fee.student.name,
                contact: fee.student.mobile,
                email: fee.student.email || ''
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Verify Payment After Razorpay Callback ---- */
router.post('/verify', protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, feeId } = req.body;

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'demo_secret')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        const isValid = expectedSignature === razorpay_signature || razorpay_order_id.startsWith('demo_');

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        // Mark fee as paid
        const fee = await Fee.findById(feeId);
        if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });

        fee.status = 'paid';
        fee.paymentMethod = 'razorpay';
        fee.paidAmount = fee.netAmount;
        fee.paidAt = new Date();
        fee.razorpayPaymentId = razorpay_payment_id;
        fee.razorpaySignature = razorpay_signature;
        fee.transactionId = razorpay_payment_id;
        await fee.save();

        res.json({
            success: true,
            message: '✅ Payment successful! Your fee has been recorded.',
            receiptNumber: fee.receiptNumber
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Get Payment Receipt ---- */
router.get('/receipt/:feeId', protect, async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.feeId)
            .populate('student', 'name rollNumber mobile studentClass')
            .populate('course', 'title');

        if (!fee) return res.status(404).json({ success: false, message: 'Not found.' });

        // Students can only see their own receipts
        if (req.user.role === 'student' && fee.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.json({ success: true, data: fee });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
