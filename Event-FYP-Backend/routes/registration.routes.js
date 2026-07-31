const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const Registration = require('../models/Registration');

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

// Student / Volunteer registers for an event
router.post(
  '/register',
  authMiddleware,
  roleMiddleware('Student', 'Volunteer'),
  registrationController.registerForEvent
);

// ─────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────

// Mark attendance using QR
router.put(
  '/attendance/qr',
  authMiddleware,
  roleMiddleware('Organizer', 'Admin'),
  registrationController.markAttendanceByQR
);

// Export attendance report
router.get(
  '/attendance-report/export',
  authMiddleware,
  roleMiddleware('Admin'),
  registrationController.exportAttendanceReport
);

// Get attendance of a specific event
router.get(
  '/events/:event_id',
  authMiddleware,
  roleMiddleware('Organizer', 'Admin'),
  registrationController.getEventAttendance
);

// ✅ NEW: Preview attendance report (JSON, before download)
router.get('/attendance-report/preview', authMiddleware, roleMiddleware('Admin'), registrationController.previewAttendanceReport);

// ─────────────────────────────────────────────
// STUDENT
// ─────────────────────────────────────────────

// Student's own registrations
router.get(
  '/my-registrations',
  authMiddleware,
  roleMiddleware('Student'),
  registrationController.getStudentRegistrations
);

// ─────────────────────────────────────────────
// ORGANIZER / ADMIN
// ─────────────────────────────────────────────

// Get volunteers of an event
router.get(
  '/event/:event_id/volunteers',
  authMiddleware,
  roleMiddleware('Admin', 'Organizer'),
  registrationController.getVolunteersByEvent
);

// Get all registrations of an event
router.get(
  '/event/:eventId',
  authMiddleware,
  roleMiddleware('Admin', 'Organizer'),
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const registrations = await Registration.find({
        event_id: eventId
      })
        .populate('student_id', 'name email registration_no department')
        .populate('event_id', 'title');

      res.status(200).json({
        success: true,
        data: registrations
      });

    } catch (error) {
      console.error('Error fetching registrations:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch registrations',
        error: error.message
      });
    }
  }
);

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

// Cancel registration
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('Student'),
  registrationController.cancelRegistration
);

module.exports = router;