const express = require('express');
const router = express.Router();

const studentController = require('../controllers/student.controller');

// AUTH
router.post('/register', studentController.registerStudent);
router.post('/login', studentController.loginStudent);

// CRUD
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
