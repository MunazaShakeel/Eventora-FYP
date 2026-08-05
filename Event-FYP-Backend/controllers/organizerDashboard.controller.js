const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Task = require('../models/Task');
const Feedback = require('../models/Feedback');
const Certificate = require('../models/Certificate');
const { sendNotification } = require('../utils/notification'); // ✅ Notification import

// ==================== MAIN STATS ====================
exports.getOrganizerDashboardStats = async (req, res) => {
    try {
        const organizerId = new mongoose.Types.ObjectId(req.user.id);

        const organizerEvents = await Event.find({ organizer_id: organizerId }).select('_id');
        const eventIds = organizerEvents.map(e => e._id);

        if (eventIds.length === 0) {
            return res.json({
                events: { totalEvents: 0, approvedEvents: 0, rejectedEvents: 0 },
                registrations: { totalRegistrations: 0, presentCount: 0, absentCount: 0 },
                tasks: { totalTasks: 0, completedTasks: 0, pendingTasks: 0 },
                totalCertificates: 0,
                topEvents: []
            });
        }

        const totalEvents = eventIds.length;
        const approvedEvents = await Event.countDocuments({ _id: { $in: eventIds }, approved: true });
        const rejectedEvents = await Event.countDocuments({ _id: { $in: eventIds }, approved: false });

        const totalRegistrations = await Registration.countDocuments({ event_id: { $in: eventIds } });
        const presentCount = await Registration.countDocuments({ 
            event_id: { $in: eventIds }, 
            attendance_status: 'Present' 
        });
        const absentCount = totalRegistrations - presentCount;

        const totalTasks = await Task.countDocuments({ event_id: { $in: eventIds } });
        const completedTasks = await Task.countDocuments({ event_id: { $in: eventIds }, status: 'Completed' });
        const pendingTasks = await Task.countDocuments({ event_id: { $in: eventIds }, status: 'Pending' });

        const totalCertificates = await Certificate.countDocuments({ event_id: { $in: eventIds } });

        const topEvents = await Feedback.aggregate([
            {
                $match: {
                    event_id: { $in: eventIds }
                }
            },
            {
                $group: {
                    _id: "$event_id",
                    avgRating: { $avg: "$rating" },
                    totalFeedbacks: { $sum: 1 }
                }
            },
            { $sort: { avgRating: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "events",
                    localField: "_id",
                    foreignField: "_id",
                    as: "eventDetails"
                }
            },
            {
                $addFields: {
                    title: { $arrayElemAt: ["$eventDetails.title", 0] }
                }
            },
            {
                $project: {
                    avgRating: 1,
                    totalFeedbacks: 1,
                    title: 1
                }
            }
        ]);

        res.json({
            events: { totalEvents, approvedEvents, rejectedEvents },
            registrations: { totalRegistrations, presentCount, absentCount },
            tasks: { totalTasks, completedTasks, pendingTasks },
            totalCertificates,
            topEvents
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== UPCOMING EVENTS ====================
exports.getUpcomingEvents = async (req, res) => {
    try {
        const organizerId = new mongoose.Types.ObjectId(req.user.id);

        const upcomingEvents = await Event.find({
            organizer_id: organizerId,
            approved: true,
            start_date: { $gte: new Date() }
        })
        .sort({ start_date: 1 })
        .limit(5)
        .select('title venue start_date start_time end_time status');

        res.json({ upcomingEvents });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== RECENT REGISTRATIONS ====================
exports.getRecentRegistrations = async (req, res) => {
    try {
        const organizerId = new mongoose.Types.ObjectId(req.user.id);

        const organizerEvents = await Event.find({ organizer_id: organizerId }).select('_id title');
        const eventIds = organizerEvents.map(e => e._id);

        if (eventIds.length === 0) return res.json({ recentRegistrations: [] });

        const recentRegistrations = await Registration.find({
            event_id: { $in: eventIds }
        })
        .sort({ registration_date: -1 })
        .limit(5)
        .populate('student_id', 'name email')
        .populate('event_id', 'title');

        res.json({ recentRegistrations });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== REGISTRATION TRENDS (Last 7 days) ====================
exports.getRegistrationTrends = async (req, res) => {
    try {
        const organizerId = new mongoose.Types.ObjectId(req.user.id);

        const organizerEvents = await Event.find({ organizer_id: organizerId }).select('_id');
        const eventIds = organizerEvents.map(e => e._id);

        if (eventIds.length === 0) return res.json({ trends: [] });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trends = await Registration.aggregate([
            {
                $match: {
                    event_id: { $in: eventIds },
                    registration_date: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$registration_date" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const result = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const found = trends.find(t => t._id === dateStr);
            result.push({
                date: date.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' }),
                count: found ? found.count : 0
            });
        }

        res.json({ trends: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== NEW: SEND NOTIFICATION TO ORGANIZER ====================
// 🆕 This can be called from other controllers to notify organizer
exports.sendOrganizerNotification = async (req, res) => {
    try {
        const { title, message, type = 'system', relatedId = null } = req.body;
        const organizerId = req.user.id;

        const notification = await sendNotification(
            organizerId,
            title,
            message,
            type,
            relatedId
        );

        res.status(200).json({
            success: true,
            message: 'Notification sent successfully',
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== NEW: GET ORGANIZER NOTIFICATIONS ====================
exports.getOrganizerNotifications = async (req, res) => {
    try {
        const { getUserNotifications } = require('../utils/notification');
        const result = await getUserNotifications(req.user.id);

        if (result.success) {
            res.status(200).json({
                success: true,
                notifications: result.notifications,
                unreadCount: result.unreadCount
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== NEW: MARK NOTIFICATION AS READ ====================
exports.markNotificationRead = async (req, res) => {
    try {
        const { markAsRead } = require('../utils/notification');
        const result = await markAsRead(req.params.id, req.user.id);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Notification marked as read',
                notification: result.notification
            });
        } else {
            res.status(500).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== NEW: MARK ALL NOTIFICATIONS AS READ ====================
exports.markAllNotificationsRead = async (req, res) => {
    try {
        const { markAllAsRead } = require('../utils/notification');
        const result = await markAllAsRead(req.user.id);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'All notifications marked as read'
            });
        } else {
            res.status(500).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== NEW: DELETE NOTIFICATION ====================
exports.deleteNotification = async (req, res) => {
    try {
        const { deleteNotification } = require('../utils/notification');
        const result = await deleteNotification(req.params.id, req.user.id);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } else {
            res.status(500).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};