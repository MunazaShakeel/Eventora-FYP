const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Task = require('../models/Task');
const Feedback = require('../models/Feedback');
const Certificate = require('../models/Certificate');

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

       // Registrations - ✅ Attendance formula
const totalRegistrations = await Registration.countDocuments({ event_id: { $in: eventIds } });
const presentCount = await Registration.countDocuments({ 
    event_id: { $in: eventIds }, 
    attendance_status: 'Present' 
});
const absentCount = totalRegistrations - presentCount;  // ✅ YEH LINE ADD KAREN

        const totalTasks = await Task.countDocuments({ event_id: { $in: eventIds } });
        const completedTasks = await Task.countDocuments({ event_id: { $in: eventIds }, status: 'Completed' });
        const pendingTasks = await Task.countDocuments({ event_id: { $in: eventIds }, status: 'Pending' });

        const totalCertificates = await Certificate.countDocuments({ event_id: { $in: eventIds } });

       // ✅ Yeh lagao
const topEvents = await Feedback.aggregate([
  {
    $match: {
      event_id: { $in: eventIds }   // sirf is organizer ke events
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

        // Last 7 days
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

        // Fill missing days with 0
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