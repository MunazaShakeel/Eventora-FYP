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

