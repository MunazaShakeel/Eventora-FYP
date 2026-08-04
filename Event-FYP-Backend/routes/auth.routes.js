
//login/regiter 
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateLogin, validateRegister } = require('../validations/auth.validation');

// ----------------- AUTH ROUTES -----------------
router.post('/register', validateRegister, authController.registerUser);
router.post('/login', validateLogin, authController.loginUser);



router.get('/check-email', authController.checkEmail); // Check in all collections
router.get('/students/check-email', authController.checkStudentEmail);
router.get('/organizers/check-email', authController.checkOrganizerEmail);
router.get('/admins/check-email', authController.checkAdminEmail);

module.exports = router;
