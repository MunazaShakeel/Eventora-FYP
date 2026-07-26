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

// ✅ NEW: Get volunteers by event (Admin/Organizer)
router.get('/event/:event_id/volunteers', authMiddleware, roleMiddleware('Admin', 'Organizer'), registrationController.getVolunteersByEvent);





// Get all registrations for a specific event
router.get(
  '/event/:eventId',
  authMiddleware,
  roleMiddleware('Admin', 'Organizer'),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const registrations = await Registration.find({ event_id: eventId })
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


module.exports = router;