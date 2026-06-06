const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    certificate_type: {
        type: String,
        enum: ['Participation', 'Volunteer', 'Winner'],
        default: 'Participation'
    },
    certificate_url: {
        type: String
    },
    issued_date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

/*  Prevent duplicate certificates */
certificateSchema.index(
    { student_id: 1, event_id: 1 },
    { unique: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
