const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/organizerDashboard.controller');

const auth = [authMiddleware, roleMiddleware('Organizer')];

router.get('/stats', ...auth, dashboardController.getOrganizerDashboardStats);
router.get('/upcoming-events', ...auth, dashboardController.getUpcomingEvents);
router.get('/recent-registrations', ...auth, dashboardController.getRecentRegistrations);
router.get('/registration-trends', ...auth, dashboardController.getRegistrationTrends);

module.exports = router;