const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // MongoDB connection (Mongoose 7+ me options auto enabled)
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1); // Stop server if DB connection fails because the app
        //  cannot function without a database
    }
};

module.exports = connectDB;
