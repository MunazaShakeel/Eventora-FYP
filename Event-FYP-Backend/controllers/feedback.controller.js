const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Student = require('../models/Student');
const { sendNotification } = require('../utils/notification'); // ✅ Notification import

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

        // 🆕 Notify Organizer about new feedback
        try {
            if (event.organizer_id) {
                const student = await Student.findById(student_id);
                await sendNotification(
                    event.organizer_id,
                    'New Feedback Received',
                    `${student?.name || 'A student'} gave ${rating}★ rating for your event "${event.title}"`,
                    'system',
                    event._id
                );
            }
        } catch (notifyErr) {
            console.error('Notification error (submitFeedback):', notifyErr.message);
        }

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