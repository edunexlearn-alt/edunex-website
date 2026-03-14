/* ============================================================
   ENQUIRIES ROUTES (server/routes/enquiries.js)
   ============================================================ */
const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const { protect, authorize } = require('../middleware/auth');

/* ---- Public: Submit Enquiry (from website forms) ---- */
router.post('/', async (req, res) => {
    try {
        const enquiry = await Enquiry.create({
            ...req.body,
            source: req.body.source || 'website'
        });
        res.status(201).json({
            success: true,
            message: 'Thank you! We will contact you within 24 hours.',
            id: enquiry._id
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Admin: Get All Enquiries ---- */
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, priority, search } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search) {
            filter.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Enquiry.countDocuments(filter);
        const enquiries = await Enquiry.find(filter)
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ success: true, total, totalPages: Math.ceil(total / limit), data: enquiries });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ---- Admin: Update Enquiry Status ---- */
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, priority, followUpDate, note } = req.body;
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) return res.status(404).json({ success: false, message: 'Not found.' });

        if (status) enquiry.status = status;
        if (priority) enquiry.priority = priority;
        if (followUpDate) enquiry.followUpDate = followUpDate;
        if (note) {
            enquiry.followUpNotes.push({ note, addedBy: req.user._id });
        }

        await enquiry.save();
        res.json({ success: true, message: 'Enquiry updated.', data: enquiry });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
