/* ============================================================
   USER MODEL (server/models/User.js)
   Handles: Students, Parents, Admins
   ============================================================ */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    // --- Identity ---
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        unique: true,
        sparse: true,    // allow null for students without email
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false        // never return password in queries
    },

    // --- Role & Access ---
    role: {
        type: String,
        enum: ['student', 'parent', 'admin', 'teacher'],
        default: 'student'
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // --- Student Profile ---
    rollNumber: { type: String, unique: true, sparse: true },
    studentClass: {
        type: String,
        enum: ['5', '6', '7', '8', '9', '10', '11-PCM', '11-PCB', '12-PCM', '12-PCB', 'Computer', 'Other'],
    },
    parentName: { type: String, trim: true },
    parentMobile: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },

    // --- Academic Info ---
    enrolledCourses: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        enrolledAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' }
    }],
    attendance: [{
        date: { type: Date },
        status: { type: String, enum: ['present', 'absent', 'late'] },
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
    }],

    // --- Fee Info ---
    feeStatus: {
        type: String,
        enum: ['paid', 'pending', 'partial', 'overdue'],
        default: 'pending'
    },

    // --- Auth ---
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,

    // --- Photo ---
    photo: { type: String, default: null },

    // --- Timestamps ---
    joinDate: { type: Date, default: Date.now }
}, { timestamps: true });

/* ---- Indexes ---- */
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ rollNumber: 1 });

/* ---- Pre-save: Hash password ---- */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/* ---- Generate Roll Number for students ---- */
userSchema.pre('save', async function (next) {
    if (this.role === 'student' && !this.rollNumber) {
        const count = await this.constructor.countDocuments({ role: 'student' });
        this.rollNumber = `EDX${new Date().getFullYear()}${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

/* ---- Instance Methods ---- */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
