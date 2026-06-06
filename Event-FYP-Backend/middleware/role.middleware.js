const Registration = require('../models/Registration');

// ===============================
// 🎯 EVENT ROLE MIDDLEWARE
// ===============================
exports.eventRoleMiddleware = (requiredRole, eventIdParam = 'event_id') => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const eventId = req.params[eventIdParam] || req.body[eventIdParam];

            if (!eventId) {
                return res.status(400).json({ message: 'Event ID missing' });
            }

            const registration = await Registration.findOne({
                student_id: userId,
                event_id: eventId
            });

            if (!registration) {
                return res.status(403).json({
                    message: 'You are not registered for this event'
                });
            }

            if (registration.role !== requiredRole) {
                return res.status(403).json({
                    message: `Only ${requiredRole} can access this`
                });
            }

            req.registration = registration;
            next();

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };
};