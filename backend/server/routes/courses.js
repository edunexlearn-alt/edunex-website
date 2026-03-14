/* ============================================================
   COURSES ROUTES (server/routes/courses.js)
   ============================================================ */
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

/* ---- Public: Get All Courses ---- */
router.get('/', async (req, res) => {
    try {
        const { category, isActive = true } = req.query;
        const filter = { isVisible: true };
        if (category) filter.category = category;
        if (isActive) filter.isActive = isActive === 'true';

        const courses = await Course.find(filter)
            .sort({ order: 1, createdAt: 1 })
            .populate('batches.teacher', 'name');
        res.json({ success: true, count: courses.length, data: courses });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Public: Get Single Course ---- */
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('batches.teacher', 'name');
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        res.json({ success: true, data: course });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Create Course ---- */
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json({ success: true, message: 'Course created.', data: course });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Update Course ---- */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!course) return res.status(404).json({ success: false, message: 'Not found.' });
        res.json({ success: true, message: 'Course updated.', data: course });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Delete Course ---- */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Course deleted.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
