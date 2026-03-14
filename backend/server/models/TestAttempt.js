/* ============================================================
   TEST ATTEMPT MODEL (server/models/TestAttempt.js)
   Stores each student's test attempt and results
   ============================================================ */
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedAnswer: { type: String },
    isCorrect: { type: Boolean },
    marksObtained: { type: Number, default: 0 }
});

const testAttemptSchema = new mongoose.Schema({
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    answers: [answerSchema],

    // Score
    totalMarks: { type: Number, default: 0 },
    marksObtained: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    grade: { type: String },   // A+, A, B, C, D, F

    // Timing
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    timeTaken: { type: Number },     // minutes

    // Status
    status: {
        type: String,
        enum: ['in-progress', 'submitted', 'timed-out'],
        default: 'in-progress'
    },

    // Attempt number
    attemptNumber: { type: Number, default: 1 },

    // Rank among all attempts of this test
    rank: { type: Number }

}, { timestamps: true });

/* ---- Auto-calculate grade ---- */
testAttemptSchema.pre('save', function (next) {
    if (this.percentage !== undefined) {
        if (this.percentage >= 90) this.grade = 'A+';
        else if (this.percentage >= 75) this.grade = 'A';
        else if (this.percentage >= 60) this.grade = 'B';
        else if (this.percentage >= 50) this.grade = 'C';
        else if (this.percentage >= 35) this.grade = 'D';
        else this.grade = 'F';
    }
    next();
});

testAttemptSchema.index({ test: 1, student: 1 });
testAttemptSchema.index({ student: 1, submittedAt: -1 });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
