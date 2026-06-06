const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    media_type: { type: String, enum: ['Image', 'Video'], required: true },
    media_url: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
