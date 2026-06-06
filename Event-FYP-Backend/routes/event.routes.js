const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { uploadEventImage } = require('../middleware/upload.middleware');
const { getAllEventsAdmin } = require('../controllers/event.controller');

// ── PUBLIC ──
router.get('/', eventController.getAllEvents);

// ✅ SAARE SPECIFIC ROUTES PEHLE — /:id se upar
router.get('/all', authMiddleware, roleMiddleware('Organizer', 'Admin'), getAllEventsAdmin);
router.get('/organizer', authMiddleware, roleMiddleware('Organizer'), eventController.getMyEvents);

// ── DYNAMIC ROUTE BAAD MEIN ──
router.get('/:id', eventController.getEventById);

// ── ORGANIZER CRUD ──
router.post('/', authMiddleware, roleMiddleware('Organizer'), uploadEventImage.single('image'), eventController.createEvent);
router.put('/:id', authMiddleware, roleMiddleware('Organizer'), uploadEventImage.single('image'), eventController.updateEvent);
router.delete('/:id', authMiddleware, roleMiddleware('Organizer'), eventController.deleteEvent);

// ── ADMIN ──
router.put('/:id/approve', authMiddleware, roleMiddleware('Admin'), eventController.approveEvent);

module.exports = router;