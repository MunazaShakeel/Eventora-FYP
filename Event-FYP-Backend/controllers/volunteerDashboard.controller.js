const fs = require('fs');
const path = require('path');
const Registration = require('../models/Registration');
const Task = require('../models/Task');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const Certificate = require('../models/Certificate');

// 1) My registrations as Volunteer
exports.getMyVolunteerRegistrations = async (req, res) => {
    try {
        const volunteerId = req.user.id;

        const registrations = await Registration.find({
            student_id: volunteerId,
            role: 'Volunteer'
        })
            .populate('event_id', 'title description venue start_date end_date status')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2) Assigned tasks (optionally filter by event_id query param)
exports.getAssignedTasks = async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { event_id } = req.query;

        const volunteerRegistrations = await Registration.find({
            student_id: volunteerId,
            role: 'Volunteer'
        }).select('_id');

        const registrationIds = volunteerRegistrations.map((registration) => registration._id);

        const filter = { assigned_to: { $in: registrationIds } };
        if (event_id) filter.event_id = event_id;

        const tasks = await Task.find(filter)
            .populate('event_id', 'title start_date end_date venue')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3) Update task status: Pending / In Progress / Completed
exports.updateTaskStatus = async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { task_id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['Pending', 'In Progress', 'Completed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Use Pending, In Progress, or Completed'
            });
        }

        const task = await Task.findById(task_id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const registration = await Registration.findById(task.assigned_to);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Assigned volunteer registration not found' });
        }

        if (registration.student_id.toString() !== volunteerId) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
        }

        task.status = status;
        await task.save();

        return res.status(200).json({
            success: true,
            message: 'Task status updated successfully',
            data: task
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4) Submit feedback for volunteer event experience
exports.submitVolunteerFeedback = async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { event_id, rating, comments } = req.body;

        if (!event_id || !rating) {
            return res.status(400).json({ success: false, message: 'event_id and rating are required' });
        }

        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const volunteerRegistration = await Registration.findOne({
            student_id: volunteerId,
            event_id,
            role: 'Volunteer',
            attendance_status: 'Present'
        });

        if (!volunteerRegistration) {
            return res.status(403).json({
                success: false,
                message: 'Feedback allowed only for attended events as Volunteer'
            });
        }

        const existingFeedback = await Feedback.findOne({
            student_id: volunteerId,
            event_id
        });

        if (existingFeedback) {
            return res.status(400).json({ success: false, message: 'Feedback already submitted' });
        }

        const feedback = await Feedback.create({
            student_id: volunteerId,
            event_id,
            rating,
            comments,
            submitted_at: new Date()
        });

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5) Volunteer certificates
exports.getMyVolunteerCertificates = async (req, res) => {
    try {
        const volunteerId = req.user.id;

        const certificates = await Certificate.find({
            student_id: volunteerId,
            certificate_type: { $in: ['Volunteer', 'Participation'] }
        })
            .populate('event_id', 'title start_date end_date venue')
            .sort({ issued_date: -1 });

        return res.status(200).json({
            success: true,
            count: certificates.length,
            data: certificates
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 6) Download volunteer certificate
exports.downloadVolunteerCertificate = async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const { certificate_id } = req.params;

        const certificate = await Certificate.findOne({
            _id: certificate_id,
            student_id: volunteerId,
            certificate_type: { $in: ['Volunteer', 'Participation'] }
        });

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
        return res.status(500).json({ success: false, message: error.message });
    }
};
