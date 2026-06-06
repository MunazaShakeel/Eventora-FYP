
//login/regiter 
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateLogin, validateRegister } = require('../validations/auth.validation');

// ----------------- AUTH ROUTES -----------------
router.post('/register', validateRegister, authController.registerUser);
router.post('/login', validateLogin, authController.loginUser);

module.exports = router;
