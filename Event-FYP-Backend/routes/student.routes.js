const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// ── PUBLIC ROUTES ──
router.post('/register', studentController.registerStudent);
router.post('/login', studentController.loginStudent);

// ── PROTECTED ROUTES ──
router.use(authMiddleware);

// Self profile routes (Student only) - MUST be before /:id
router.get('/me', roleMiddleware('Student'), studentController.getProfile);
router.put('/me', roleMiddleware('Student'), studentController.updateProfile);

// Admin only routes
router.get('/', roleMiddleware('Admin'), studentController.getAllStudents);
router.get('/:id', roleMiddleware('Admin'), studentController.getStudentById);
router.put('/:id', roleMiddleware('Admin'), studentController.updateStudent);
router.delete('/:id', roleMiddleware('Admin'), studentController.deleteStudent);

module.exports = router;