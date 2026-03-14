/* ============================================================
   TESTS ROUTES (server/routes/tests.js)
   Online Test System
   ============================================================ */
const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const { protect, authorize } = require('../middleware/auth');

/* ---- Get Available Tests for Student ---- */
router.get('/', protect, authorize('student', 'admin'), async (req, res) => {
    try {
        const now = new Date();
        const filter = {
            isActive: true,
            $or: [
                { availableFrom: { $lte: now }, availableTill: { $gte: now } },
                { availableFrom: null, availableTill: null }
            ]
        };
        if (req.query.course) filter.course = req.query.course;

        const tests = await Test.find(filter)
            .select('-questions.correctAnswer -questions.explanation')  // hide answers
            .populate('course', 'title');

        // Mark which tests student has already attempted
        const attempted = await TestAttempt.find({
            student: req.user.role === 'student' ? req.user._id : null,
            status: 'submitted'
        }).select('test attemptNumber');

        const attemptedMap = {};
        attempted.forEach(a => { attemptedMap[a.test.toString()] = a.attemptNumber; });

        const testsWithStatus = tests.map(t => ({
            ...t.toObject(),
            myAttempts: attemptedMap[t._id.toString()] || 0,
            canAttempt: (attemptedMap[t._id.toString()] || 0) < t.maxAttempts
        }));

        res.json({ success: true, data: testsWithStatus });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Start a Test (returns questions without answers) ---- */
router.post('/:id/start', protect, authorize('student'), async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test || !test.isActive) {
            return res.status(404).json({ success: false, message: 'Test not found or inactive.' });
        }

        // Check max attempts
        const previousAttempts = await TestAttempt.countDocuments({
            test: test._id, student: req.user._id, status: 'submitted'
        });
        if (previousAttempts >= test.maxAttempts) {
            return res.status(403).json({ success: false, message: `Maximum ${test.maxAttempts} attempt(s) reached.` });
        }

        // Check if an in-progress attempt exists
        let attempt = await TestAttempt.findOne({
            test: test._id, student: req.user._id, status: 'in-progress'
        });

        if (!attempt) {
            attempt = await TestAttempt.create({
                test: test._id,
                student: req.user._id,
                totalMarks: test.totalMarks,
                attemptNumber: previousAttempts + 1
            });
        }

        // Shuffle questions if required
        let questions = [...test.questions];
        if (test.shuffleQuestions) {
            questions = questions.sort(() => Math.random() - 0.5);
        }

        // Remove answers from response
        const safeQuestions = questions.map(q => {
            let opts = q.options ? [...q.options] : [];
            if (test.shuffleOptions && opts.length > 0) {
                opts = opts.sort(() => Math.random() - 0.5);
            }
            return {
                _id: q._id,
                questionText: q.questionText,
                type: q.type,
                options: opts,
                marks: q.marks
            };
        });

        res.json({
            success: true,
            attemptId: attempt._id,
            test: {
                _id: test._id,
                title: test.title,
                duration: test.duration,
                totalMarks: test.totalMarks,
                totalQuestions: questions.length
            },
            questions: safeQuestions
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Submit Test ---- */
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
    try {
        const { attemptId, answers } = req.body;  // answers: [{questionId, selectedAnswer}]

        const test = await Test.findById(req.params.id);
        const attempt = await TestAttempt.findOne({ _id: attemptId, student: req.user._id, status: 'in-progress' });

        if (!attempt) return res.status(404).json({ success: false, message: 'Active attempt not found.' });

        // Grade answers
        let marksObtained = 0;
        const gradedAnswers = (answers || []).map(ans => {
            const question = test.questions.id(ans.questionId);
            if (!question) return null;

            const isCorrect = question.correctAnswer === ans.selectedAnswer;
            const marks = isCorrect
                ? question.marks
                : -question.negativeMarks;

            marksObtained += marks;
            return {
                questionId: ans.questionId,
                selectedAnswer: ans.selectedAnswer,
                isCorrect,
                marksObtained: marks < 0 ? 0 : marks
            };
        }).filter(Boolean);

        marksObtained = Math.max(0, marksObtained);  // no negative total
        const percentage = test.totalMarks > 0 ? Math.round((marksObtained / test.totalMarks) * 100) : 0;
        const timeTaken = Math.round((new Date() - attempt.startedAt) / 60000);

        attempt.answers = gradedAnswers;
        attempt.marksObtained = marksObtained;
        attempt.percentage = percentage;
        attempt.isPassed = marksObtained >= test.passingMarks;
        attempt.submittedAt = new Date();
        attempt.timeTaken = timeTaken;
        attempt.status = 'submitted';

        await attempt.save();

        // Update test stats
        await Test.findByIdAndUpdate(test._id, { $inc: { totalAttempts: 1 } });

        // Build result with correct answers (if showAnswers is enabled)
        const result = {
            marksObtained,
            totalMarks: test.totalMarks,
            percentage,
            isPassed: attempt.isPassed,
            grade: attempt.grade,
            timeTaken
        };

        if (test.showAnswers) {
            result.questionResults = test.questions.map(q => ({
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                studentAnswer: answers?.find(a => a.questionId === q._id.toString())?.selectedAnswer
            }));
        }

        res.json({ success: true, message: 'Test submitted.', data: result });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Create Test ---- */
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const test = await Test.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, message: 'Test created.', data: test });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Get All Tests ---- */
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
    try {
        const tests = await Test.find().populate('course', 'title').sort({ createdAt: -1 });
        res.json({ success: true, data: tests });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Update Test ---- */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: test });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Get Test Results ---- */
router.get('/:id/results', protect, authorize('admin'), async (req, res) => {
    try {
        const attempts = await TestAttempt.find({ test: req.params.id, status: 'submitted' })
            .populate('student', 'name rollNumber studentClass')
            .sort({ marksObtained: -1 });

        // Assign ranks
        const ranked = attempts.map((a, idx) => ({ ...a.toObject(), rank: idx + 1 }));

        res.json({ success: true, data: ranked });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
