/* ============================================================
   ENQUIRY MODEL (server/models/Enquiry.js)
   Admission & Contact Enquiries
   ============================================================ */
const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    // Personal Info
    studentName: { type: String, required: true, trim: true },
    parentName: { type: String, trim: true },
    mobile: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },

    // Enquiry Details
    type: {
        type: String,
        enum: ['admission', 'contact', 'callback', 'demo-class'],
        default: 'admission'
    },
    courseInterest: { type: String },
    currentClass: { type: String },
    preferredBatch: { type: String },
    message: { type: String },

    // Follow-up
    status: {
        type: String,
        enum: ['new', 'contacted', 'interested', 'enrolled', 'not-interested', 'closed'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    followUpDate: { type: Date },
    followUpNotes: [{
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Source
    source: {
        type: String,
        enum: ['website', 'walk-in', 'phone', 'whatsapp', 'referral', 'social-media', 'other'],
        default: 'website'
    },
    referredBy: { type: String },

    // Lead conversion
    convertedToStudent: { type: Boolean, default: false },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });

enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ mobile: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
