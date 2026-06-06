const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    rating: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    submitted_at: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
