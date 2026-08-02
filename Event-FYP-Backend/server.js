require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');

const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

// 🆕 Notification imports
const http = require('http');
const { initSocket } = require('./utils/socket');
const notificationUtils = require('./utils/notification');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const organizerRoutes = require('./routes/organizer.routes');
const adminRoutes = require('./routes/admin.routes');
const eventRoutes = require('./routes/event.routes');
const registrationRoutes = require('./routes/registration.routes');
const taskRoutes = require('./routes/task.routes');
const certificateRoutes = require('./routes/certificate.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const galleryRoutes = require('./routes/gallery.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const organizerDashboardRoutes = require('./routes/organizerDashboard.routes');
const studentDashboardRoutes = require('./routes/studentDashboard.routes');
const volunteerDashboardRoutes = require('./routes/volunteerDashboard.routes');

// 🆕 Import auth middleware
const { authMiddleware, allowRoles } = require('./middleware/auth.middleware');

const app = express();
 app.use(cors());
// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:5173',
//   credentials: true
// }));
app.use(express.json());
app.use(morgan('dev'));
const path = require('path');
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/organizer-dashboard', organizerDashboardRoutes);
app.use('/api/student-dashboard', studentDashboardRoutes);
app.use('/api/volunteer-dashboard', volunteerDashboardRoutes);


// // Health Check (ADD THIS BEFORE ERROR HANDLER)
// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     message: 'Server is running',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });



// 🆕 NOTIFICATION ROUTES (Protected with authMiddleware)
app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const result = await notificationUtils.getUserNotifications(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const result = await notificationUtils.markAsRead(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
    try {
        const result = await notificationUtils.markAllAsRead(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
    try {
        const result = await notificationUtils.deleteNotification(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const result = await notificationUtils.deleteAllNotifications(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.use((err, req, res, next) => {
    if (!err) return next();
    if (err.name === 'MulterError') {
        return res.status(400).json({ message: err.message });
    }
    if (err.message && err.message.includes('Only JPG, PNG, WEBP images are allowed')) {
        return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message || 'Internal server error' });
});

app.get('/', (req, res) => {
    res.send('Event Management Portal Backend is running 🚀');
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

mongoose.connect(process.env.MONGO_URI, {
    dbName: 'event_portal'
})
.then(async () => {
    console.log('✅ MongoDB connected');

    const existingAdmin = await Admin.findOne({ email: 'admin@college.com' });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('ADmin786', 10);
        await Admin.create({
            email: 'admin@college.com',
            password: hashedPassword
        });
        console.log('✅ Default Admin Created');
    } else {
        console.log('ℹ️ Admin Already Exists');
    }

    // Initialize socket
    initSocket(server);

    server.listen(PORT, () =>
        console.log(`🚀 Server running on port ${PORT}`)
    );
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
});