const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');


// Public
router.post('/login', adminController.loginAdmin);


// Protected
router.use(authMiddleware);
router.use(roleMiddleware('Admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/all-users', adminController.getAllUsers);

router.get('/', adminController.getAllAdmins);
router.get('/:id', adminController.getAdminById);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;