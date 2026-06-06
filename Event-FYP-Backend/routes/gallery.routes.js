const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const galleryController = require('../controllers/gallery.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Multer Storage Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/gallery/');
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|mp4|webm/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        if (ext) cb(null, true);
        else cb(new Error('Only images and videos allowed'));
    }
});

// Upload media → Organizer
router.post('/upload', authMiddleware, roleMiddleware('Organizer'), upload.single('media'), galleryController.uploadMedia);

// Get media by event → All users
router.get('/event/:event_id', authMiddleware, galleryController.getMediaByEvent);

// Delete media → Organizer / Admin
router.delete('/:id', authMiddleware, roleMiddleware('Organizer', 'Admin'), galleryController.deleteMedia);

module.exports = router;