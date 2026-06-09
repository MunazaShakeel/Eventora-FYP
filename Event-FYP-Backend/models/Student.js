const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    grade: { type: String },
    semester: { type: String },
    department: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);