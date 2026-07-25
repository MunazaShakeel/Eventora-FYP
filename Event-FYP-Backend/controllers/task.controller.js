const Task = require('../models/Task');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// ------------------ CREATE TASK (Organizer) ------------------
exports.createTask = async (req, res) => {
    try {
        const { event_id, title, description, assigned_to } = req.body;

        // Check if event exists
        const event = await Event.findById(event_id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Resolve assigned volunteer registration by registration id OR student id
        const volunteerRegistration = await Registration.findOne({
            event_id,
            role: 'Volunteer',
            $or: [
                { _id: assigned_to },
                { student_id: assigned_to }
            ]
        });

        if (!volunteerRegistration) {
            return res.status(400).json({ message: 'Assigned student is not a volunteer for this event' });
        }

        const task = await Task.create({
            event_id,
            title,
            description,
            assigned_to: volunteerRegistration._id,
            status: 'Pending'
        });

        res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ UPDATE TASK (Volunteer) ------------------
exports.updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body; // Pending / In Progress / Completed
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Only assigned volunteer (registration's student_id) can update
        const registration = await Registration.findById(task.assigned_to);
        if (!registration) return res.status(404).json({ message: 'Assigned volunteer registration not found' });

        if (registration.student_id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        task.status = status;
        await task.save();

        res.json({ message: 'Task status updated', task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET TASKS BY EVENT ------------------
exports.getTasksByEvent = async (req, res) => {
    try {
        const { event_id } = req.params;
        const tasks = await Task.find({ event_id }).populate({
            path: 'assigned_to',
            select: 'student_id role attendance_status',
            populate: {
                path: 'student_id',
                select: 'name email department'
            }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET TASKS BY VOLUNTEER ------------------
exports.getTasksByVolunteer = async (req, res) => {
    try {
        const volunteer_id = req.user.id;
        const volunteerRegistrations = await Registration.find({
            student_id: volunteer_id,
            role: 'Volunteer'
        }).select('_id');

        const registrationIds = volunteerRegistrations.map((registration) => registration._id);

        const tasks = await Task.find({ assigned_to: { $in: registrationIds } }).populate('event_id', 'title start_date end_date');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ DELETE TASK (Organizer/Admin) ------------------
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Organizer can delete their event tasks OR Admin
        const event = await Event.findById(task.event_id);
        if (req.user.role === 'Organizer' && event.organizer_id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }

        await task.deleteOne();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ------------------ ADMIN: GET ALL TASKS WITH FILTERS ------------------
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
      .populate('assigned_by', 'name email')
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

// ------------------ ADMIN: GET TASK STATISTICS ------------------
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

// ------------------ ADMIN: GET EVENT TASK PROGRESS ------------------
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

    // Filter only events with tasks
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


// ============ ADMIN TASK APIs ============

// 1️⃣ GET ALL TASKS WITH FILTERS
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
        populate: { path: 'student_id', select: 'name email department' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2️⃣ GET TASK STATISTICS
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
            $multiply: [{ $divide: ['$completed', { $max: ['$count', 1] }] }, 100]
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
            $multiply: [{ $divide: ['$completed', { $max: ['$count', 1] }] }, 100]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: { totalTasks, pendingTasks, inProgressTasks, completedTasks, tasksByEvent, tasksByVolunteer }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3️⃣ GET EVENT-WISE PROGRESS
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

    res.status(200).json({
      success: true,
      data: eventProgress.filter(e => e.totalTasks > 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4️⃣ GET VOLUNTEERS WITH THEIR TASKS FOR AN EVENT
exports.adminGetEventVolunteersTasks = async (req, res) => {
  try {
    const { event_id } = req.params;

    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Get all volunteers
    const volunteers = await Registration.find({
      event_id: event_id,
      role: 'Volunteer'
    }).populate('student_id', 'name email department phone');

    // Get all tasks
    const tasks = await Task.find({ event_id: event_id })
      .populate('assigned_to', 'student_id');

    // Map volunteers with tasks
    const result = volunteers.map(volunteer => {
      const volunteerTasks = tasks.filter(task =>
        task.assigned_to?._id.toString() === volunteer._id.toString()
      );

      return {
        volunteer: {
          _id: volunteer._id,
          student: volunteer.student_id,
          role: volunteer.role,
          attendance_status: volunteer.attendance_status
        },
        tasks: volunteerTasks.map(task => ({
          _id: task._id,
          title: task.title,
          description: task.description,
          status: task.status,
          createdAt: task.createdAt
        })),
        taskCount: volunteerTasks.length,
        completedCount: volunteerTasks.filter(t => t.status === 'Completed').length
      };
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};