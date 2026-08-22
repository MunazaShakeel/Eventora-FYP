const Organizer = require('../models/Organizer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const Task = require('../models/Task');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const { sendNotification } = require('../utils/notification');

// ------------------ REGISTER ORGANIZER ------------------
async function registerOrganizer(req, res) {
    try {
        const { name, email, phone, department, password } = req.body;
        const existing = await Organizer.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const organizer = await Organizer.create({
            name, email, phone, department, password: hashedPassword
        });

        const Admin = require('../models/Admin');
        const admin = await Admin.findOne(); 
        if (admin) {
            await sendNotification(
                admin._id,
                'New Organizer Registered 🎉',
                `${name} (${email}) has registered as an organizer`,
                'system',
                organizer._id 
            );
        }

        res.status(201).json({ message: 'Organizer registered successfully', organizer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ------------------ LOGIN ORGANIZER ------------------
async function loginOrganizer(req, res) {
    try {
        const { email, password } = req.body;
        const organizer = await Organizer.findOne({ email });
        if (!organizer) return res.status(404).json({ message: 'Organizer not found' });

        const isMatch = await bcrypt.compare(password, organizer.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        await sendNotification(
            organizer._id,
            'New Login Detected 🔐',
            `You logged into your organizer account at ${new Date().toLocaleString()}`,
            'system'
        );

        const token = jwt.sign(
            { id: organizer._id, role: 'Organizer' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ------------------ GET ALL ORGANIZERS ------------------
async function getAllOrganizers(req, res) {
    try {
        const organizers = await Organizer.find().select('-password');
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ------------------ GET ORGANIZER BY ID ------------------
async function getOrganizerById(req, res) {
    try {
        const organizer = await Organizer.findById(req.params.id).select('-password');
        if (!organizer) return res.status(404).json({ message: 'Organizer not found' });
        res.json(organizer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ------------------ GET PROFILE (SELF) ------------------
async function getProfile(req, res) {
    try {
        const organizer = await Organizer.findById(req.user.id).select('-password');
        if (!organizer) return res.status(404).json({ message: 'Organizer not found' });
        res.json(organizer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ------------------ UPDATE PROFILE (SELF) ------------------
async function updateProfile(req, res) {
    try {
        const { name, phone, department, password } = req.body;
        const updateData = { name, phone, department };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const organizer = await Organizer.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
        if (!organizer) return res.status(404).json({ message: 'Organizer not found' });

        await sendNotification(
            req.user.id,
            'Profile Updated ✅',
            `Your profile information has been updated successfully.`,
            'system'
        );

        res.json({ message: 'Profile updated successfully', organizer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ------------------ UPDATE ORGANIZER (ADMIN USE) ------------------
async function updateOrganizer(req, res) {
    try {
        const { name, phone, department, password } = req.body;
        const updateData = { name, phone, department };
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const organizer = await Organizer.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
        if (!organizer) return res.status(404).json({ message: 'Organizer not found' });

        res.json({ message: 'Organizer updated successfully', organizer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ------------------ DELETE ORGANIZER ------------------
async function deleteOrganizer(req, res) {
    try {
        const organizer = await Organizer.findById(req.params.id);
        if (!organizer) return res.status(404).json({ message: 'Organizer not found' });

        await sendNotification(
            organizer._id,
            'Account Deleted ⚠️',
            `Your organizer account has been deleted by admin. Contact support if this was a mistake.`,
            'system'
        );

        await Organizer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Organizer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ------------------ GET MY EVENTS (Organizer) ------------------
async function getMyEvents(req, res) {
    try {
        const events = await Event.find({ organizer_id: req.user.id });
        res.json({ events });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ================= ORGANIZER DASHBOARD STATS =================
async function getOrganizerDashboardStats(req, res) {
    try {
        const organizerId = req.user.id;
        const organizerEvents = await Event.find({ organizer_id: organizerId }).select('_id');
        const eventIds = organizerEvents.map((event) => event._id);

        const totalEvents = eventIds.length;

        if (eventIds.length === 0) {
            return res.json({
                totalEvents: 0,
                totalTasks: 0,
                completedTasks: 0,
                attendanceStats: [],
                avgRating: 0
            });
        }

        const totalTasks = await Task.countDocuments({ event_id: { $in: eventIds } });
        const completedTasks = await Task.countDocuments({ event_id: { $in: eventIds }, status: 'Completed' });

        const attendanceStats = await Registration.aggregate([
            { $match: { event_id: { $in: eventIds } } },
            { $group: { _id: '$attendance_status', count: { $sum: 1 } } }
        ]);

        const feedbackStats = await Feedback.aggregate([
            { $match: { event_id: { $in: eventIds } } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        res.json({
            totalEvents,
            totalTasks,
            completedTasks,
            attendanceStats,
            avgRating: feedbackStats[0]?.avgRating || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ================= MODULE EXPORTS =================
module.exports = {
    registerOrganizer,
    loginOrganizer,
    getAllOrganizers,
    getOrganizerById,
    getProfile,
    updateProfile,
    updateOrganizer,
    deleteOrganizer,
    getMyEvents,
    getOrganizerDashboardStats
};