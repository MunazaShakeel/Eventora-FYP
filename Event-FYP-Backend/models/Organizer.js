const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    department: { type: String },
    password: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Organizer', organizerSchema);
