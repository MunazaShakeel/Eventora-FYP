const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Student = require('../models/Student');

// ------------------ SUBMIT FEEDBACK ------------------
exports.submitFeedback = async (req, res) => {
    try {
        const { event_id, rating, comments } = req.body;
        const student_id = req.user.id;

        // Check if event exists
        const event = await Event.findById(event_id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check if student already submitted feedback
        const existing = await Feedback.findOne({ event_id, student_id });
        if (existing) return res.status(400).json({ message: 'Feedback already submitted' });

        const feedback = await Feedback.create({
            student_id,
            event_id,
            rating,
            comments,
            submitted_at: new Date()
        });

        res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET FEEDBACKS FOR EVENT (Admin / Organizer) ------------------
exports.getFeedbacksByEvent = async (req, res) => {
    try {
        const { event_id } = req.params;

        const feedbacks = await Feedback.find({ event_id })
            .populate('student_id', 'name email')
            .populate('event_id', 'title start_date end_date');

        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ------------------ GET TOP RATED EVENTS ------------------
exports.getTopRatedEvents = async (req, res) => {
    try {
        const topEvents = await Feedback.aggregate([
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
                    from: "events",         // MongoDB collection name (usually lowercase plural)
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

        res.json(topEvents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET FEEDBACKS BY STUDENT ------------------
exports.getFeedbacksByStudent = async (req, res) => {
    try {
        const student_id = req.user.id;

        const feedbacks = await Feedback.find({ student_id })
            .populate('event_id', 'title start_date end_date venue')
            .populate('student_id', 'name email');

        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ DELETE FEEDBACK (Admin) ------------------
exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

        await feedback.deleteOne();
        res.json({ message: 'Feedback deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// ── GET ALL FEEDBACKS (ADMIN) ──
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('student_id', 'name email')
      .populate('event_id', 'title start_date venue')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    console.error('Get all feedbacks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ===================== ADMIN TASK APIs =====================

// ── 1. GET ALL TASKS WITH FILTERS ──
exports.adminGetAllTasks = async (req, res) => {
  try {
    const { event_id, status, volunteer_id, search } = req.query;
    let query = {};

    if (event_id) query.event_id = event_id;
    if (status) query.status = status;
    if (volunteer_id) query.assigned_to = volunteer_id;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('event_id', 'title start_date venue')
      .populate({
        path: 'assigned_to',
        populate: {
          path: 'student_id',
          select: 'name email department'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Admin get tasks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── 2. GET TASK STATISTICS ──
exports.adminGetTaskStats = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'Pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
    const completedTasks = await Task.countDocuments({ status: 'Completed' });

    // Tasks by event
    const tasksByEvent = await Task.aggregate([
      {
        $group: {
          _id: '$event_id',
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          eventTitle: '$event.title',
          eventVenue: '$event.venue',
          count: 1,
          pending: 1,
          inProgress: 1,
          completed: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completed', { $max: ['$count', 1] }] },
              100
            ]
          }
        }
      }
    ]);

    // Tasks by volunteer
    const tasksByVolunteer = await Task.aggregate([
      {
        $group: {
          _id: '$assigned_to',
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: '_id',
          as: 'registration'
        }
      },
      { $unwind: { path: '$registration', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'students',
          localField: 'registration.student_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          volunteerName: { $ifNull: ['$student.name', 'Unknown'] },
          volunteerEmail: { $ifNull: ['$student.email', ''] },
          count: 1,
          completed: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completed', { $max: ['$count', 1] }] },
              100
            ]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        tasksByEvent,
        tasksByVolunteer
      }
    });
  } catch (error) {
    console.error('Admin task stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── 3. GET EVENT-WISE PROGRESS ──
exports.adminGetEventProgress = async (req, res) => {
  try {
    const events = await Event.find().select('_id title start_date venue');

    const eventProgress = await Promise.all(
      events.map(async (event) => {
        const tasks = await Task.find({ event_id: event._id });
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;
        const pending = tasks.filter(t => t.status === 'Pending').length;

        return {
          event: {
            _id: event._id,
            title: event.title,
            start_date: event.start_date,
            venue: event.venue
          },
          totalTasks: total,
          completed,
          inProgress,
          pending,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      })
    );

    const filtered = eventProgress.filter(e => e.totalTasks > 0);

    res.status(200).json({
      success: true,
      data: filtered
    });
  } catch (error) {
    console.error('Admin event progress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};