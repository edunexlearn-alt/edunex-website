/* ============================================================
   CERTIFICATE ROUTES
   POST   /api/certificates          — admin generate
   GET    /api/certificates          — admin list
   GET    /api/certificates/:id      — admin get by Mongo _id
   PATCH  /api/certificates/:id/revoke
   GET    /api/certificates/verify/:certificateId — public verify
   ============================================================ */
const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

/* ---- PUBLIC: Verify by certificate number ---- */
router.get('/verify/:certificateId', async (req, res) => {
    try {
        const code = String(req.params.certificateId || '').trim().toUpperCase();
        if (!code) {
            return res.status(400).json({ success: false, message: 'Certificate number is required.' });
        }

        const cert = await Certificate.findOne({ certificateId: code })
            .populate('course', 'title code')
            .lean();

        if (!cert) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: 'Certificate not found. Please check the number and try again.'
            });
        }

        if (cert.status === 'revoked') {
            return res.json({
                success: true,
                valid: false,
                message: 'This certificate has been revoked.',
                data: {
                    certificateId: cert.certificateId,
                    studentName: cert.studentName,
                    courseTitle: cert.courseTitle,
                    status: cert.status
                }
            });
        }

        return res.json({
            success: true,
            valid: true,
            message: 'Certificate is valid.',
            data: {
                certificateId: cert.certificateId,
                studentName: cert.studentName,
                courseTitle: cert.courseTitle,
                programSubtitle: cert.programSubtitle,
                duration: cert.duration,
                batch: cert.batch,
                mode: cert.mode,
                startDate: cert.startDate,
                completionDate: cert.completionDate,
                skills: cert.skills,
                status: cert.status,
                issuedAt: cert.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- ADMIN: List ---- */
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { search, status } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { certificateId: new RegExp(search, 'i') },
                { studentName: new RegExp(search, 'i') },
                { courseTitle: new RegExp(search, 'i') }
            ];
        }

        const certs = await Certificate.find(filter)
            .populate('student', 'name email mobile rollNumber')
            .populate('course', 'title code')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, count: certs.length, data: certs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- ADMIN: Get one ---- */
router.get('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const cert = await Certificate.findById(req.params.id)
            .populate('student', 'name email mobile rollNumber')
            .populate('course', 'title code')
            .lean();
        if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
        res.json({ success: true, data: cert });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- ADMIN: Generate ---- */
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const {
            studentId,
            courseId,
            studentName,
            courseTitle,
            courseCode,
            programSubtitle,
            description,
            duration,
            batch,
            mode,
            startDate,
            completionDate,
            skills,
            notes
        } = req.body;

        if (!studentName || !completionDate) {
            return res.status(400).json({
                success: false,
                message: 'Student name and completion date are required.'
            });
        }

        let resolvedTitle = courseTitle;
        let resolvedCode = courseCode;
        let courseRef = null;

        if (courseId) {
            const course = await Course.findById(courseId);
            if (course) {
                courseRef = course._id;
                if (!resolvedTitle) resolvedTitle = course.certificateTitle || course.title;
                if (!resolvedCode) resolvedCode = Certificate.toCourseSlug(course.code || course.title);
            }
        }

        if (!resolvedTitle) {
            return res.status(400).json({ success: false, message: 'Course title is required.' });
        }

        const slug = Certificate.toCourseSlug(resolvedCode || resolvedTitle);
        const year = completionDate
            ? new Date(completionDate).getFullYear()
            : new Date().getFullYear();

        const certificateId = await Certificate.generateCertificateId(slug, year);

        let studentRef = null;
        if (studentId) {
            const student = await User.findById(studentId);
            if (student) studentRef = student._id;
        }

        const skillsArr = Array.isArray(skills)
            ? skills
            : (typeof skills === 'string' && skills.trim()
                ? skills.split(',').map(s => s.trim()).filter(Boolean)
                : []);

        const cert = await Certificate.create({
            certificateId,
            student: studentRef,
            course: courseRef,
            studentName: studentName.trim(),
            courseTitle: resolvedTitle.trim(),
            courseCode: slug,
            programSubtitle: programSubtitle || 'TRAINING PROGRAM',
            description: description || 'This program was designed to provide in-depth knowledge and hands-on experience.',
            duration: duration || '3 MONTHS',
            batch: batch || String(year),
            mode: mode || 'ONLINE / OFFLINE',
            startDate: startDate ? new Date(startDate) : undefined,
            completionDate: new Date(completionDate),
            skills: skillsArr,
            issuedBy: req.user._id,
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Certificate generated successfully.',
            data: cert
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'Certificate ID collision. Please try again.' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- ADMIN: Revoke ---- */
router.patch('/:id/revoke', protect, authorize('admin'), async (req, res) => {
    try {
        const cert = await Certificate.findByIdAndUpdate(
            req.params.id,
            { status: 'revoked' },
            { new: true }
        );
        if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
        res.json({ success: true, message: 'Certificate revoked.', data: cert });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
