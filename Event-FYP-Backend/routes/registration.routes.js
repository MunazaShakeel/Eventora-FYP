const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Student/Volunteer registers for event
router.post('/register', authMiddleware, roleMiddleware('Student', 'Volunteer'), registrationController.registerForEvent);

// Cancel registration (Student only)
router.delete('/:id', authMiddleware, roleMiddleware('Student'), registrationController.cancelRegistration);

// Mark attendance via QR (Organizer/Admin can scan QR)
router.put('/attendance/qr', authMiddleware, roleMiddleware('Organizer', 'Admin'), registrationController.markAttendanceByQR);

// Get event attendance
router.get('/events/:event_id', authMiddleware, roleMiddleware('Organizer', 'Admin'), registrationController.getEventAttendance);

// Student's own registrations
router.get('/my-registrations', authMiddleware, roleMiddleware('Student'), registrationController.getStudentRegistrations);

module.exports = router;