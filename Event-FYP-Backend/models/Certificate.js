const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true  },
    organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true },
    certificate_type: { type: String,
        enum: ['Participation', 'Achievement', 'Excellence', 'Volunteer', 'Winner', 'Technical', 'Non-Technical', 'Workshop', 'Seminar', 'Sports', 'Cultural'],
        default: 'Participation'
    },
    certificate_number: { type: String,  unique: true },
    certificate_url: {type: String },
    issued_date: {type: Date, default: Date.now },
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
// Fix: countDocuments() ki jagah highest number dhoond ke +1 karte hain,
// taake delete hone ke baad bhi number collide na ho.
certificateSchema.pre('save', async function() {
    if (!this.certificate_number) {
        const CertificateModel = mongoose.model('Certificate');
        let nextNum = 1;
        let isUnique = false;

        while (!isUnique) {
            const lastCert = await CertificateModel.findOne({
                certificate_number: { $regex: /^CERT-\d+$/ }
            }).sort({ certificate_number: -1 });

            if (lastCert && lastCert.certificate_number) {
                const lastNum = parseInt(lastCert.certificate_number.split('-')[1], 10);
                if (!isNaN(lastNum)) nextNum = lastNum + 1;
            }

            const candidate = `CERT-${String(nextNum).padStart(5, '0')}`;
            const exists = await CertificateModel.findOne({ certificate_number: candidate });

            if (!exists) {
                this.certificate_number = candidate;
                isUnique = true;
            } else {
                nextNum++; //
            }
        }
    }
});

module.exports = mongoose.model('Certificate', certificateSchema);