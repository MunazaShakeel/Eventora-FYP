const Gallery = require('../models/Gallery');
const Event = require('../models/Event');
const path = require('path');
const { sendNotification } = require('../utils/notification'); // ✅ Notification import

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

        // 🆕 Notify Admin about new media upload
        try {
            const Admin = require('../models/Admin');
            const admins = await Admin.find().select('_id');
            for (const admin of admins) {
                await sendNotification(
                    admin._id,
                    'New Gallery Media 🖼️',
                    `New ${media_type || 'Image'} uploaded for event "${event.title}"`,
                    'system',
                    event._id
                );
            }
        } catch (notifyErr) {
            console.error('Notification error (uploadMedia - admin):', notifyErr.message);
        }

        // 🆕 Notify Organizer about successful upload
        try {
            await sendNotification(
                req.user.id,
                'Media Uploaded Successfully ✅',
                `Your ${media_type || 'image'} for "${event.title}" has been uploaded successfully.`,
                'system',
                media._id
            );
        } catch (notifyErr) {
            console.error('Notification error (uploadMedia - organizer):', notifyErr.message);
        }

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

        const mediaType = media.media_type;
        const eventTitle = event.title;

        await media.deleteOne();

        // 🆕 Notify Admin about media deletion
        try {
            const Admin = require('../models/Admin');
            const admins = await Admin.find().select('_id');
            for (const admin of admins) {
                await sendNotification(
                    admin._id,
                    'Gallery Media Deleted 🗑️',
                    `A ${mediaType} has been deleted from event "${eventTitle}"`,
                    'system',
                    event._id
                );
            }
        } catch (notifyErr) {
            console.error('Notification error (deleteMedia - admin):', notifyErr.message);
        }

        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};