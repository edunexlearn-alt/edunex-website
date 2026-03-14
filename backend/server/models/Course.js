/* ============================================================
   COURSE MODEL (server/models/Course.js)
   ============================================================ */
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true
    },
    code: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    category: {
        type: String,
        enum: ['academic', 'senior-secondary', 'computer'],
        required: true
    },
    subcategory: {
        type: String,    // e.g. 'PCM', 'PCB', 'Web Development', 'Python'
        trim: true
    },
    description: { type: String },
    icon: { type: String, default: 'fas fa-book' },
    colorGradient: { type: String, default: 'linear-gradient(135deg,#667eea,#764ba2)' },

    // Curriculum
    topics: [{ type: String }],
    duration: { type: String },   // e.g. '6 Months', 'Year-round'
    hoursPerWeek: { type: Number },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'all'],
        default: 'all'
    },

    // Fee
    monthlyFee: { type: Number, default: 0 },
    admissionFee: { type: Number, default: 0 },
    totalFee: { type: Number, default: 0 },

    // Batches
    batches: [{
        name: { type: String },         // e.g. 'Morning Batch'
        time: { type: String },         // e.g. '8:00 AM – 10:00 AM'
        days: { type: String },         // e.g. 'Mon-Sat'
        capacity: { type: Number, default: 20 },
        enrolled: { type: Number, default: 0 },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        startDate: { type: Date },
        isActive: { type: Boolean, default: true }
    }],

    // Status
    isActive: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },    // show on website
    order: { type: Number, default: 0 },        // display order

    // Stats
    totalStudents: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },

    // Eligibility
    eligibility: { type: String },

    // Certificate
    hasCertificate: { type: Boolean, default: false },
    certificateTitle: { type: String }

}, { timestamps: true });

courseSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
