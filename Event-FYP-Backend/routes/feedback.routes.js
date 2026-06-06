const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Submit feedback → Student / Volunteer
router.post('/', authMiddleware, roleMiddleware('Student', 'Volunteer'), feedbackController.submitFeedback);

// Get feedbacks for event → Admin / Organizer
router.get('/event/:event_id', authMiddleware, roleMiddleware('Admin', 'Organizer'), feedbackController.getFeedbacksByEvent);

// Get feedbacks by student → Student
router.get('/my', authMiddleware, roleMiddleware('Student'), feedbackController.getFeedbacksByStudent);
// Get top rated events → Admin / Organizer
router.get('/top-rated', authMiddleware, roleMiddleware('Admin', 'Organizer'), feedbackController.getTopRatedEvents);

// ✅ Delete feedback → Admin OR Organizer (was only Admin before)
router.delete('/:id', authMiddleware, roleMiddleware('Admin', 'Organizer'), feedbackController.deleteFeedback);

module.exports = router;