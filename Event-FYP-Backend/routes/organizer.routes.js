const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizer.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

/* ================= PUBLIC ROUTES ================= */
router.post('/register', organizerController.registerOrganizer);
router.post('/login', organizerController.loginOrganizer);

/* ============== PROTECTED ROUTES ================= */
router.use(authMiddleware, roleMiddleware('Organizer'));

// Organizer profile
router.get('/me', organizerController.getProfile);
router.put('/me', organizerController.updateProfile);

// Organizer dashboard
router.get('/dashboard/stats', organizerController.getOrganizerDashboardStats);

// Organizer's own events
router.get('/my-events', organizerController.getMyEvents);

// ⚠️ Dynamic routes LAST
router.get('/', organizerController.getAllOrganizers);
router.get('/:id', organizerController.getOrganizerById);
router.put('/:id', organizerController.updateOrganizer);
router.delete('/:id', organizerController.deleteOrganizer);

module.exports = router;