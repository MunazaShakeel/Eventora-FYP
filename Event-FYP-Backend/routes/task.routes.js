const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// ── ORGANIZER ──
router.post('/', authMiddleware, roleMiddleware('Organizer'), taskController.createTask);
router.get('/event/:event_id', authMiddleware, roleMiddleware('Organizer', 'Admin'), taskController.getTasksByEvent);

// ── VOLUNTEER ──
router.put('/:id', authMiddleware, roleMiddleware('Student', 'Volunteer'), taskController.updateTaskStatus);
router.get('/my-tasks', authMiddleware, roleMiddleware('Volunteer', 'Student'), taskController.getTasksByVolunteer);

// ── DELETE ──
router.delete('/:id', authMiddleware, roleMiddleware('Organizer', 'Admin'), taskController.deleteTask);

// ✅ ADMIN ROUTES - ADD THESE 4
router.get('/admin/all', authMiddleware, roleMiddleware('Admin'), taskController.adminGetAllTasks);
router.get('/admin/stats', authMiddleware, roleMiddleware('Admin'), taskController.adminGetTaskStats);
router.get('/admin/event-progress', authMiddleware, roleMiddleware('Admin'), taskController.adminGetEventProgress);
router.get('/admin/event/:event_id/volunteers-tasks', authMiddleware, roleMiddleware('Admin'), taskController.adminGetEventVolunteersTasks);

module.exports = router;