const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Issue certificate
router.post('/issue', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.issueCertificate);

// Get all certificates (Admin sees all, Organizer sees only their events)
router.get('/', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.getAllCertificates);

// Get organizer's certificates (explicit endpoint)
router.get('/my-events', authMiddleware, roleMiddleware('Organizer'), certificateController.getOrganizerCertificates);

// Get student's certificates
router.get('/my', authMiddleware, roleMiddleware('Student', 'Volunteer'), certificateController.getCertificatesByStudent);

// ✅ DOWNLOAD CERTIFICATE (NEW)
router.get('/download/:id', authMiddleware, certificateController.downloadCertificate);

// ✅ DELETE CERTIFICATE - New Route
router.delete('/:id', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.deleteCertificate);


// Verify certificate (public)
router.get('/verify/:certificate_id', certificateController.verifyCertificate);

module.exports = router;