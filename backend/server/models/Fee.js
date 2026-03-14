/* ============================================================
   FEE MODEL (server/models/Fee.js)
   Fee records & payment tracking
   ============================================================ */
const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },

    // Fee Details
    feeType: {
        type: String,
        enum: ['monthly', 'quarterly', 'half-yearly', 'annual', 'admission', 'exam', 'late-fee', 'other'],
        required: true
    },
    amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discountReason: { type: String },
    netAmount: { type: Number },    // amount - discount

    // Billing Period
    month: { type: String },       // 'January 2024'
    dueDate: { type: Date, required: true },

    // Payment Status
    status: {
        type: String,
        enum: ['pending', 'paid', 'partial', 'overdue', 'waived'],
        default: 'pending'
    },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date },

    // Payment Method
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi', 'bank-transfer', 'razorpay', 'cheque', 'dd', 'other'],
    },
    transactionId: { type: String },        // Razorpay / UPI ref
    receiptNumber: { type: String, unique: true, sparse: true },

    // Razorpay Payment Data
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Notes
    notes: { type: String },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // admin/staff

    // Late fee
    isLate: { type: Boolean, default: false },
    lateDays: { type: Number, default: 0 }

}, { timestamps: true });

/* ---- Auto-calculate netAmount ---- */
feeSchema.pre('save', function (next) {
    this.netAmount = this.amount - (this.discount || 0);
    if (this.paidAmount >= this.netAmount) {
        this.status = 'paid';
        if (!this.paidAt) this.paidAt = new Date();
    } else if (this.paidAmount > 0) {
        this.status = 'partial';
    } else if (new Date() > this.dueDate && this.status === 'pending') {
        this.status = 'overdue';
    }
    next();
});

/* ---- Generate Receipt Number ---- */
feeSchema.pre('save', async function (next) {
    if (!this.receiptNumber && this.status === 'paid') {
        const count = await this.constructor.countDocuments({ status: 'paid' });
        this.receiptNumber = `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

feeSchema.index({ student: 1, status: 1 });
feeSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Fee', feeSchema);
