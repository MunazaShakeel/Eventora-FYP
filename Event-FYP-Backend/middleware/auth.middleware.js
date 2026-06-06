// const jwt = require('jsonwebtoken');

// // ------------------ AUTHENTICATION ------------------
// exports.authMiddleware = (req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization;

//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.status(401).json({ message: 'Authorization token missing' });
//         }

//         const token = authHeader.split(' ')[1];
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         req.user = {
//             id: decoded.id,
//             role: decoded.role
//         };

//         next();
//     } catch (error) {
//         res.status(401).json({ message: 'Invalid or expired token' });
//     }
// };

// // ------------------ ROLE-BASED ACCESS ------------------
// exports.roleMiddleware = (...allowedRoles) => {
//     return (req, res, next) => {
//         if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

//         if (!allowedRoles.includes(req.user.role)) {
//             return res.status(403).json({ message: 'Forbidden: Access denied' });
//         }

//         next();
//     };
// };


const jwt = require('jsonwebtoken');

// ===============================
// 🔐 AUTH MIDDLEWARE
// ===============================
exports.authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Keep compatibility with tokens that use either `role` or `type`
        const role = decoded.role || decoded.type;

        req.user = {
            id: decoded.id,
            role,
            type: role
        };

        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};



// ===============================
// 🔒 ROLE MIDDLEWARE (SYSTEM LEVEL)
// ===============================
exports.allowRoles = (...allowedTypes) => {
    return (req, res, next) => {
        const userType = req.user && (req.user.type || req.user.role);
        if (!req.user || !allowedTypes.includes(userType)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

// Backward-compatible export used by existing routes
exports.roleMiddleware = exports.allowRoles;
