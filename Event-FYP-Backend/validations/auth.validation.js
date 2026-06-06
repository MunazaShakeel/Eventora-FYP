const { body, validationResult } = require('express-validator');

exports.validateRegister = [
    body('role').isIn(['Student', 'Volunteer', 'Organizer', 'Admin']).withMessage('Invalid role'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    }
];

exports.validateLogin = [
    body('role').isIn(['Student', 'Volunteer', 'Organizer', 'Admin']).withMessage('Invalid role'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    }
];
