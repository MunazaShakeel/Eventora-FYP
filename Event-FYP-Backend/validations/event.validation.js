const { body, validationResult } = require('express-validator');

exports.validateEvent = [
    body('title').notEmpty().withMessage('Event title is required'),
    body('venue').notEmpty().withMessage('Venue is required'),
    body('start_date').isISO8601().withMessage('Start date is required'),
    body('end_date').isISO8601().withMessage('End date is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    }
];
