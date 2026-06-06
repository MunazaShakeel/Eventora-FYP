// controllers/studentDashboard.controller.js
const path = require('path');
const fs = require('fs');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const Gallery = require('../models/Gallery');
const Certificate = require('../models/Certificate');

// 1) My Registrations
exports.getMyRegistrations = async (req, res) => {
    try {
        const studentId = req.user.id;

        const registrations = await Registration.find({ student_id: studentId })
            .populate('event_id', 'title description venue start_date end_date status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2) Event Response (Feedback for attended events only)
exports.submitEventResponse = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { event_id, rating, comments } = req.body;

        if (!event_id || !rating) {
            return res.status(400).json({ success: false, message: 'event_id and rating are required' });
        }

        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const registration = await Registration.findOne({
            student_id: studentId,
            event_id,
            attendance_status: 'Present'
        });

        if (!registration) {
            return res.status(403).json({
                success: false,
                message: 'Feedback allowed only for attended events'
            });
        }

        const existing = await Feedback.findOne({ student_id: studentId, event_id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Feedback already submitted' });
        }

        const feedback = await Feedback.create({
            student_id: studentId,
            event_id,
            rating,
            comments,
            submitted_at: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3) Event Gallery (for events student is registered in)
exports.getEventGallery = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { event_id } = req.params;

        const registration = await Registration.findOne({ student_id: studentId, event_id });
        if (!registration) {
            return res.status(403).json({
                success: false,
                message: 'You are not registered for this event'
            });
        }

        const media = await Gallery.find({ event_id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: media.length,
            data: media
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4) Certificate list for student
exports.getMyCertificates = async (req, res) => {
    try {
        const studentId = req.user.id;

        const certificates = await Certificate.find({ student_id: studentId })
            .populate('event_id', 'title start_date end_date venue')
            .sort({ issued_date: -1 });

        res.status(200).json({
            success: true,
            count: certificates.length,
            data: certificates
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5) Certificate download
exports.downloadCertificate = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { certificate_id } = req.params;

        const certificate = await Certificate.findOne({
            _id: certificate_id,
            student_id: studentId
        }).populate('event_id', 'title');

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        if (!certificate.certificate_url) {
            return res.status(404).json({ success: false, message: 'Certificate file not available' });
        }

        const filePath = path.isAbsolute(certificate.certificate_url)
            ? certificate.certificate_url
            : path.join(process.cwd(), certificate.certificate_url);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Certificate file missing on server' });
        }

        return res.download(filePath);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
