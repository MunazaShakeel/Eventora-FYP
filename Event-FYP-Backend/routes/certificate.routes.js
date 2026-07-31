// const express = require('express');
// const router = express.Router();
// const certificateController = require('../controllers/certificate.controller');
// const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// // Issue certificate
// router.post('/issue', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.issueCertificate);

// // Get all certificates (Admin sees all, Organizer sees only their events)
// router.get('/', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.getAllCertificates);
// // ✅ UPDATE CERTIFICATE - New Route
// router.put('/:id', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.updateCertificate);

// // Get organizer's certificates (explicit endpoint)
// router.get('/my-events', authMiddleware, roleMiddleware('Organizer'), certificateController.getOrganizerCertificates);

// // Get student's certificates
// router.get('/my', authMiddleware, roleMiddleware('Student', 'Volunteer'), certificateController.getCertificatesByStudent);

// // ✅ DOWNLOAD CERTIFICATE (NEW)
// router.get('/download/:id', authMiddleware, certificateController.downloadCertificate);

// // ✅ DELETE CERTIFICATE - New Route
// router.delete('/:id', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.deleteCertificate);


// // Verify certificate (public)
// router.get('/verify/:certificate_id', certificateController.verifyCertificate);

// module.exports = router;





// const express = require('express');
// const router = express.Router();
// const certificateController = require('../controllers/certificate.controller');
// const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');


// // ─── BULK ISSUE CERTIFICATES ───
// router.post('/issue-bulk', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.issueBulkCertificates);
// // ─── ISSUE CERTIFICATE ───
// router.post('/issue', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.issueCertificate);

// // ─── GET ALL CERTIFICATES (GENERIC) ───
// router.get('/', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.getAllCertificates);

// // ─── ✅ ADMIN-SPECIFIC ROUTES ───
// // Admin gets all certificates with filters & pagination
// router.get('/admin/certificates', 
//   authMiddleware, 
//   roleMiddleware('Admin'), 
//   certificateController.getAdminCertificates
// );

// // Admin gets single certificate details
// router.get('/admin/certificates/:id', 
//   authMiddleware, 
//   roleMiddleware('Admin'), 
//   certificateController.getAdminCertificateById
// );

// // Admin downloads certificate
// router.get('/admin/certificates/download/:id', 
//   authMiddleware, 
//   roleMiddleware('Admin'), 
//   certificateController.downloadAdminCertificate
// );

// // Admin deletes/revokes certificate
// router.delete('/admin/certificates/:id', 
//   authMiddleware, 
//   roleMiddleware('Admin'), 
//   certificateController.deleteAdminCertificate
// );

// // ─── UPDATE CERTIFICATE ───
// router.put('/:id', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.updateCertificate);

// // ─── ORGANIZER CERTIFICATES ───
// router.get('/my-events', authMiddleware, roleMiddleware('Organizer'), certificateController.getOrganizerCertificates);

// // ─── STUDENT CERTIFICATES ───
// router.get('/my', authMiddleware, roleMiddleware('Student', 'Volunteer'), certificateController.getCertificatesByStudent);

// // ─── DOWNLOAD CERTIFICATE (GENERIC) ───
// router.get('/download/:id', authMiddleware, certificateController.downloadCertificate);

// // ─── DELETE CERTIFICATE (GENERIC) ───
// router.delete('/:id', authMiddleware, roleMiddleware('Admin', 'Organizer'), certificateController.deleteCertificate);

// // ─── VERIFY CERTIFICATE (PUBLIC) ───
// router.get('/verify/:certificate_id', certificateController.verifyCertificate);

// module.exports = router;



const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// ─── ISSUE CERTIFICATES ───
router.post(
  '/issue-bulk',
  authMiddleware,
  roleMiddleware('Admin', 'Organizer'),
  certificateController.issueBulkCertificates
);

router.post(
  '/issue',
  authMiddleware,
  roleMiddleware('Admin', 'Organizer'),
  certificateController.issueCertificate
);

// ─── ADMIN ROUTES ───
router.get(
  '/admin/certificates',
  authMiddleware,
  roleMiddleware('Admin'),
  certificateController.getAdminCertificates
);

router.get(
  '/admin/certificates/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  certificateController.getAdminCertificateById
);

router.get(
  '/admin/certificates/download/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  certificateController.downloadAdminCertificate
);

router.delete(
  '/admin/certificates/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  certificateController.deleteAdminCertificate
);

// ─── ORGANIZER ROUTES ───
router.get(
  '/my-events',
  authMiddleware,
  roleMiddleware('Organizer'),
  certificateController.getOrganizerCertificates
);

// ─── STUDENT ROUTES ───
router.get(
  '/my',
  authMiddleware,
  roleMiddleware('Student', 'Volunteer'),
  certificateController.getCertificatesByStudent
);

// ─── VERIFY (PUBLIC) ───
router.get(
  '/verify/:certificate_id',
  certificateController.verifyCertificate
);

// ─── DOWNLOAD ───
router.get(
  '/download/:id',
  authMiddleware,
  certificateController.downloadCertificate
);

// ─── GET ALL ───
router.get(
  '/',
  authMiddleware,
  roleMiddleware('Admin', 'Organizer'),
  certificateController.getAllCertificates
);

// ─── UPDATE ───
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('Admin', 'Organizer'),
  certificateController.updateCertificate
);

// ─── DELETE ───
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('Admin', 'Organizer'),
  certificateController.deleteCertificate
);

module.exports = router;