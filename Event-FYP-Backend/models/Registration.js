const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    registration_date: { type: Date, default: Date.now },
    role: { type: String, enum: ['Student', 'Volunteer'], default: 'Student' },
    attendance_status: { type: String, enum: ['Present', 'Absent', 'Not Marked'], default: 'Not Marked' },
    qrCode: { type: String }  // ✅ ADD THIS
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);