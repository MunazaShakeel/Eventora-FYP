// Event-FYP-Backend/utils/notification.js
const mongoose = require('mongoose');

// ========== MODEL ==========
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['event', 'certificate', 'attendance', 'task', 'system'],
        default: 'system'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

// ========== HELPER FUNCTIONS ==========

// Send notification to user
const sendNotification = async (userId, title, message, type = 'system', relatedId = null) => {
    try {
        const notification = new Notification({
            userId,
            title,
            message,
            type,
            relatedId
        });
        
        await notification.save();
        
        // Send real-time via socket
        const io = global.io;
        if (io) {
            io.to(`user_${userId}`).emit('new-notification', {
                _id: notification._id,
                title,
                message,
                type,
                createdAt: notification.createdAt
            });
        }
        
        console.log(`✅ Notification sent to user ${userId}: ${title}`);
        return notification;
        
    } catch (error) {
        console.error('❌ Notification error:', error);
        return null;
    }
};

// Get user's notifications
const getUserNotifications = async (userId, limit = 50) => {
    try {
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit);
        
        const unreadCount = await Notification.countDocuments({
            userId,
            isRead: false
        });
        
        return {
            success: true,
            notifications,
            unreadCount
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Mark single notification as read
const markAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );
        
        return { success: true, notification };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Mark all as read
const markAllAsRead = async (userId) => {
    try {
        await Notification.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } }
        );
        
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Delete notification
const deleteNotification = async (notificationId, userId) => {
    try {
        await Notification.findOneAndDelete({ _id: notificationId, userId });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Delete all notifications
const deleteAllNotifications = async (userId) => {
    try {
        await Notification.deleteMany({ userId });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

module.exports = {
    Notification,
    sendNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
};