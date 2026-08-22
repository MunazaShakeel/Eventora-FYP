const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    image_url: { type: String },
    venue: { type: String },
    start_date: { type: Date, required: true },
    start_time: { type: String }, // "HH:MM" format
    end_date: { type: Date, required: true },
    end_time: { type: String },   // "HH:MM" format
    organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true },
    //ek objectid hai ju organizer model ko reference kerta hai
    approved: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'], 
        default: 'Upcoming' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
