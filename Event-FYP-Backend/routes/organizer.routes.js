const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizer.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

/* ================= PUBLIC ROUTES ================= */
router.post('/register', organizerController.registerOrganizer);
router.post('/login', organizerController.loginOrganizer);

/* ============== ORGANIZER-ONLY ROUTES ================= */
router.get('/me', authMiddleware, roleMiddleware('Organizer'), organizerController.getProfile);
router.put('/me', authMiddleware, roleMiddleware('Organizer'), organizerController.updateProfile);
router.get('/dashboard/stats', authMiddleware, roleMiddleware('Organizer'), organizerController.getOrganizerDashboardStats);
router.get('/my-events', authMiddleware, roleMiddleware('Organizer'), organizerController.getMyEvents);

/* ============== ADMIN-ONLY ROUTES ================= */
router.get('/', authMiddleware, roleMiddleware('Admin'), organizerController.getAllOrganizers);
router.get('/:id', authMiddleware, roleMiddleware('Admin'), organizerController.getOrganizerById);
router.put('/:id', authMiddleware, roleMiddleware('Admin'), organizerController.updateOrganizer);
router.delete('/:id', authMiddleware, roleMiddleware('Admin'), organizerController.deleteOrganizer);

module.exports = router;