const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    description: { type: String },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' }, // Volunteer reference
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
