// Event-FYP-Backend/utils/socket.js
const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    
    io.on('connection', (socket) => {
        console.log('🔌 New client connected:', socket.id);
        
        socket.on('register-user', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`📱 User ${userId} joined room`);
        });
        
        socket.on('disconnect', () => {
            console.log('🔌 Client disconnected:', socket.id);
        });
    });
    
    global.io = io;
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };