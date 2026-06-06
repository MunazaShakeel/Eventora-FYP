const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Organizer creates task
router.post('/', authMiddleware, roleMiddleware('Organizer'), taskController.createTask);

// Volunteer updates task status
router.put('/:id', authMiddleware, roleMiddleware('Student', 'Volunteer'), taskController.updateTaskStatus);

// Get tasks by event (Organizer/Admin)
router.get('/event/:event_id', authMiddleware, roleMiddleware('Organizer', 'Admin'), taskController.getTasksByEvent);

// Get tasks by volunteer (Volunteer)
router.get('/my-tasks', authMiddleware, roleMiddleware('Volunteer', 'Student'), taskController.getTasksByVolunteer);

// Delete task (Organizer/Admin)
router.delete('/:id', authMiddleware, roleMiddleware('Organizer', 'Admin'), taskController.deleteTask);

module.exports = router;
