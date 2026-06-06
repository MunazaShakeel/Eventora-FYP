const express = require('express');
const router = express.Router();
const volunteerDashboardController = require('../controllers/volunteerDashboard.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// My volunteer registrations
router.get(
    '/registrations',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    volunteerDashboardController.getMyVolunteerRegistrations
);

// Assigned tasks (optional query: ?event_id=<eventId>)
router.get(
    '/tasks',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    volunteerDashboardController.getAssignedTasks
);

// Update task status
router.put(
    '/tasks/:task_id/status',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    volunteerDashboardController.updateTaskStatus
);

// Submit volunteer feedback
router.post(
    '/feedback',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    volunteerDashboardController.submitVolunteerFeedback
);

// Volunteer certificates
router.get(
    '/certificates',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    volunteerDashboardController.getMyVolunteerCertificates
);

// Download certificate
router.get(
    '/certificates/:certificate_id/download',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    volunteerDashboardController.downloadVolunteerCertificate
);

module.exports = router;
