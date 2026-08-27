/* ============================================================
   CERTIFICATE MODEL
   ID format: EDNX-{YEAR}-{COURSE}-{SERIAL}  e.g. EDNX-2026-DATA-001
   ============================================================ */
const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    certificateId: {
        type: String,
        unique: true,
        required: true,
        uppercase: true,
        trim: true,
        index: true
    },

    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },

    studentName: { type: String, required: true, trim: true },
    courseTitle: { type: String, required: true, trim: true },
    courseCode: { type: String, required: true, uppercase: true, trim: true }, // short code used in ID (e.g. DATA)
    programSubtitle: { type: String, default: 'TRAINING PROGRAM' },
    description: {
        type: String,
        default: 'This program was designed to provide in-depth knowledge and hands-on experience.'
    },

    duration: { type: String, default: '3 MONTHS' },
    batch: { type: String },
    mode: { type: String, default: 'ONLINE / OFFLINE' },
    startDate: { type: Date },
    completionDate: { type: Date, required: true },

    skills: [{ type: String }],

    status: {
        type: String,
        enum: ['valid', 'revoked'],
        default: 'valid'
    },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String }

}, { timestamps: true });

/**
 * Build short course slug for certificate ID from full course code or title.
 * CS-DATA -> DATA, CS-PYTHON -> PYTHON, "Data Analytics" -> DATA
 */
certificateSchema.statics.toCourseSlug = function (codeOrTitle) {
    if (!codeOrTitle) return 'GEN';
    const raw = String(codeOrTitle).trim().toUpperCase();
    if (raw.includes('-')) {
        const parts = raw.split('-').filter(Boolean);
        return parts[parts.length - 1].replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GEN';
    }
    const words = raw.replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 8);
    return words.map(w => w[0]).join('').slice(0, 6) || 'GEN';
};

/**
 * Next serial for year + course slug → EDNX-2026-DATA-001
 */
certificateSchema.statics.generateCertificateId = async function (courseSlug, year) {
    const y = year || new Date().getFullYear();
    const slug = (courseSlug || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GEN';
    const prefix = `EDNX-${y}-${slug}-`;

    const latest = await this.findOne({ certificateId: new RegExp(`^${prefix}`) })
        .sort({ certificateId: -1 })
        .select('certificateId')
        .lean();

    let next = 1;
    if (latest?.certificateId) {
        const serial = parseInt(latest.certificateId.split('-').pop(), 10);
        if (!Number.isNaN(serial)) next = serial + 1;
    }

    return `${prefix}${String(next).padStart(3, '0')}`;
};

module.exports = mongoose.model('Certificate', certificateSchema);
