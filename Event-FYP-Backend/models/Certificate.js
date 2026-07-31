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
    organizer_id: {  // ✅ YEH FIELD HONA CHAHIYE
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',  // ✅ OR 'User' (jo bhi aapka organizer model hai)
        required: true
    },
    certificate_type: {
        type: String,
        enum: ['Participation', 'Achievement', 'Excellence', 'Volunteer', 'Winner', 'Technical', 'Non-Technical', 'Workshop', 'Seminar', 'Sports', 'Cultural'],
        default: 'Participation'
    },
    certificate_number: {
        type: String,
        unique: true
    },
    certificate_url: {
        type: String
    },
    issued_date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Revoked'],
        default: 'Active'
    }
}, { timestamps: true });

// Prevent duplicate certificates
certificateSchema.index(
    { student_id: 1, event_id: 1 },
    { unique: true }
);

// Auto-generate certificate number
certificateSchema.pre('save', async function() {
    if (!this.certificate_number) {
        const count = await mongoose.model('Certificate').countDocuments();
        this.certificate_number = `CERT-${String(count + 1).padStart(5, '0')}`;
    }
});

module.exports = mongoose.model('Certificate', certificateSchema);