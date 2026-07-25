// routes/feedback.routes.js
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// ── STUDENT / VOLUNTEER ROUTES ──
router.post('/', authMiddleware, roleMiddleware('Student', 'Volunteer'), feedbackController.submitFeedback);

// Get feedbacks by student → Student
router.get('/my', authMiddleware, roleMiddleware('Student'), feedbackController.getFeedbacksByStudent);

// ── ADMIN / ORGANIZER ROUTES ──
// Get feedbacks for event → Admin / Organizer
router.get('/event/:event_id', authMiddleware, roleMiddleware('Admin', 'Organizer'), feedbackController.getFeedbacksByEvent);

// Get top rated events → Admin / Organizer
router.get('/top-rated', authMiddleware, roleMiddleware('Admin', 'Organizer'), feedbackController.getTopRatedEvents);

// Get all feedbacks → Admin
router.get('/', authMiddleware, roleMiddleware('Admin'), feedbackController.getAllFeedbacks);

// Delete feedback → Admin OR Organizer
router.delete('/:id', authMiddleware, roleMiddleware('Admin', 'Organizer'), feedbackController.deleteFeedback);

// ── ✅ ADMIN ONLY ROUTES ──
// Get all feedbacks with pagination → Admin
router.get('/admin/all', authMiddleware, roleMiddleware('Admin'), feedbackController.getAllFeedbacks);

// Delete feedback → Admin only
router.delete('/admin/:id', authMiddleware, roleMiddleware('Admin'), feedbackController.deleteFeedback);

module.exports = router;