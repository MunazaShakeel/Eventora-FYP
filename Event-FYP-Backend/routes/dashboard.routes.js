const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// ------------------ DASHBOARD ROUTES ------------------

// Get dashboard stats → Admin only
router.get('/', authMiddleware, roleMiddleware('Admin'), dashboardController.getDashboardStats);

// Export dashboard as PDF → Admin only
router.get('/pdf', authMiddleware, roleMiddleware('Admin'), dashboardController.exportDashboardPDF);

// Export dashboard as Excel (placeholder) → Admin only
router.get('/excel', authMiddleware, roleMiddleware('Admin'), dashboardController.exportDashboardExcel);

module.exports = router;
