const Gallery = require('../models/Gallery');
const Event = require('../models/Event');
const path = require('path');

// ------------------ UPLOAD MEDIA (Organizer) ------------------
exports.uploadMedia = async (req, res) => {
    try {
        const { event_id, media_type } = req.body;

        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const event = await Event.findById(event_id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (req.user.role === 'Organizer' && event.organizer_id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to upload media for this event' });
        }

        const media_url = `/uploads/gallery/${req.file.filename}`;

        const media = await Gallery.create({
            event_id,
            media_type: media_type || 'Image',
            media_url,
            uploaded_at: new Date()
        });

        res.status(201).json({ message: 'Media uploaded successfully', media });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET MEDIA BY EVENT (All Users) ------------------
exports.getMediaByEvent = async (req, res) => {
    try {
        const { event_id } = req.params;
        const mediaItems = await Gallery.find({ event_id });
        res.json(mediaItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ DELETE MEDIA (Organizer / Admin) ------------------
exports.deleteMedia = async (req, res) => {
    try {
        const media = await Gallery.findById(req.params.id);
        if (!media) return res.status(404).json({ message: 'Media not found' });

        const event = await Event.findById(media.event_id);

        if (req.user.role === 'Organizer' && event.organizer_id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this media' });
        }

        await media.deleteOne();
        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};