const express = require('express');
const router = express.Router();
const studentDashboardController = require('../controllers/studentDashboard.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// My registrations
router.get(
    '/registrations',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    studentDashboardController.getMyRegistrations
);

// Submit event feedback/response
router.post(
    '/feedback',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    studentDashboardController.submitEventResponse
);

// View event gallery
router.get(
    '/gallery/:event_id',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    studentDashboardController.getEventGallery
);

// List my certificates
router.get(
    '/certificates',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    studentDashboardController.getMyCertificates
);

// Download one certificate
router.get(
    '/certificates/:certificate_id/download',
    authMiddleware,
    roleMiddleware('Student', 'Volunteer'),
    studentDashboardController.downloadCertificate
);

module.exports = router;
