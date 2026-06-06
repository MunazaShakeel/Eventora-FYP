const { body, validationResult } = require('express-validator');

exports.validateFeedback = [
    body('event_id').notEmpty().withMessage('Event ID required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    }
];
