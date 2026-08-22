

const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true }); //mongoose will automatically add createdAt and updatedAt fields to the schema

module.exports = mongoose.model('Admin', adminSchema);