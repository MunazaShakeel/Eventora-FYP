






const Event = require('../models/Event');
const Registration = require("../models/Registration");
const Feedback = require("../models/Feedback");
const Certificate = require("../models/Certificate");
const Task = require("../models/Task");
const Admin = require("../models/Admin");

// 🆕 Notification import
const { sendNotification } = require('../utils/notification');

const buildImageUrl = (req, filename) => {
    if (!filename) return undefined;
    return `${req.protocol}://${req.get('host')}/uploads/events/${filename}`;
};

// ------------------ CREATE EVENT (Organizer) ------------------
exports.createEvent = async (req, res) => {
    try {
        const { title, description, image_url, venue, start_date, start_time, end_date, end_time } = req.body;
        const uploadedImageUrl = buildImageUrl(req, req.file && req.file.filename);

        const event = await Event.create({
            title,
            description,
            image_url: uploadedImageUrl || image_url,
            venue,
            start_date,
            start_time,
            end_date,
            end_time,
            organizer_id: req.user.id,
            approved: false,
            status: 'Upcoming'
        });

        // 🆕 Notify all Admins about the new event awaiting approval
        try {
            const admins = await Admin.find().select('_id');
            for (const admin of admins) {
                await sendNotification(
                    admin._id,
                    'New Event Pending Approval',
                    `A new event "${event.title}" has been submitted and is waiting for your approval.`,
                    'event',
                    event._id
                );
            }
        } catch (notifyErr) {
            console.error('Notification error (createEvent):', notifyErr.message);
        }

        res.status(201).json({ message: 'Event created successfully', event });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ UPDATE EVENT (Organizer) ------------------
exports.updateEvent = async (req, res) => {
    try {
        const { title, description, image_url, venue, start_date, start_time, end_date, end_time } = req.body;
        const uploadedImageUrl = buildImageUrl(req, req.file && req.file.filename);
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (uploadedImageUrl) {
            updateData.image_url = uploadedImageUrl;
        } else if (image_url !== undefined) {
            updateData.image_url = image_url;
        }
        if (venue !== undefined) updateData.venue = venue;
        if (start_date !== undefined) updateData.start_date = start_date;
        if (start_time !== undefined) updateData.start_time = start_time;
        if (end_date !== undefined) updateData.end_date = end_date;
        if (end_time !== undefined) updateData.end_time = end_time;

        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, organizer_id: req.user.id },
            updateData,
            { new: true }
        );

        if (!event) return res.status(404).json({ message: 'Event not found or not authorized' });

        res.json({ message: 'Event updated successfully', event });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ APPROVE / REJECT EVENT (Admin) ------------------
exports.approveEvent = async (req, res) => {
    try {
        const { approved } = req.body;

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { approved },
            { new: true }
        );

        if (!event) return res.status(404).json({ message: 'Event not found' });

        // 🆕 Notify the Organizer about approval/rejection
        try {
            await sendNotification(
                event.organizer_id,
                approved ? 'Event Approved' : 'Event Rejected',
                approved
                    ? `Your event "${event.title}" has been approved and is now visible to everyone.`
                    : `Your event "${event.title}" has been rejected by the admin.`,
                'event',
                event._id
            );
        } catch (notifyErr) {
            console.error('Notification error (approveEvent):', notifyErr.message);
        }

        res.json({ message: `Event ${approved ? 'approved' : 'rejected'} successfully`, event });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET ALL EVENTS — only approved (Students/Public) ------------------
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ approved: true })
            .populate('organizer_id', 'name email department');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET ALL EVENTS — including unapproved (Organizer/Admin) ------------------
exports.getAllEventsAdmin = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer_id', 'name email department');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET EVENT BY ID ------------------
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer_id', 'name email department');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ DELETE EVENT (Organizer / Admin) ------------------
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (req.user.role === 'Organizer' && event.organizer_id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await event.deleteOne();
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyEvents = async (req, res) => {
  try {
    // req.user.id authMiddleware se aata hai
    const events = await Event.find({ organizer_id: req.user.id });

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};




// ── ADMIN ADDITIONAL FUNCTIONS ──

// Admin can edit ANY event
exports.adminUpdateEvent = async (req, res) => {
    try {
        const { title, description, image_url, venue, start_date, start_time, end_date, end_time, category } = req.body;
        const uploadedImageUrl = buildImageUrl(req, req.file && req.file.filename);
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (uploadedImageUrl) {
            updateData.image_url = uploadedImageUrl;
        } else if (image_url !== undefined) {
            updateData.image_url = image_url;
        }
        if (venue !== undefined) updateData.venue = venue;
        if (category !== undefined) updateData.category = category;
        if (start_date !== undefined) updateData.start_date = start_date;
        if (start_time !== undefined) updateData.start_time = start_time;
        if (end_date !== undefined) updateData.end_date = end_date;
        if (end_time !== undefined) updateData.end_time = end_time;

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('organizer_id', 'name email department');

        if (!event) return res.status(404).json({ message: 'Event not found' });

        res.json({ 
            message: 'Event updated successfully by admin', 
            event 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin can delete ANY event (with cascade)
exports.adminDeleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Cascade delete all related data
        await Promise.all([
            Registration.deleteMany({ event_id: req.params.id }),
            Feedback.deleteMany({ event_id: req.params.id }),
            Certificate.deleteMany({ event_id: req.params.id }),
            Task.deleteMany({ event_id: req.params.id })
        ]);

        await event.deleteOne();

        res.json({ 
            message: 'Event and all associated data deleted successfully by admin',
            deletedEvent: event.title
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};