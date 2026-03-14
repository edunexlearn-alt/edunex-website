/* ============================================================
   TEST MODEL (server/models/Test.js)
   Online Tests / Quizzes
   ============================================================ */
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    type: {
        type: String,
        enum: ['mcq', 'true-false', 'short-answer'],
        default: 'mcq'
    },
    options: [{ type: String }],        // For MCQ
    correctAnswer: { type: String, required: true },
    explanation: { type: String },      // Explanation shown after test
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 }
});

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Test title is required'],
        trim: true
    },
    description: { type: String },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    subject: { type: String },
    chapter: { type: String },
    type: {
        type: String,
        enum: ['chapter-test', 'mock-test', 'full-syllabus', 'practice'],
        default: 'chapter-test'
    },

    questions: [questionSchema],

    // Settings
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    duration: { type: Number, default: 60 },   // minutes
    maxAttempts: { type: Number, default: 1 },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    showAnswers: { type: Boolean, default: true }, // after submission

    // Timing
    availableFrom: { type: Date },
    availableTill: { type: Date },

    // Access
    isActive: { type: Boolean, default: true },
    allowedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    // Stats
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-calculate total marks
testSchema.pre('save', function (next) {
    if (this.questions && this.questions.length > 0) {
        this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
        this.passingMarks = Math.ceil(this.totalMarks * 0.35); // 35% passing
    }
    next();
});

module.exports = mongoose.model('Test', testSchema);
