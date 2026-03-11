"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const allowedRoles = [...roles];
        // Super Admin inherits Admin permissions
        if (allowedRoles.includes('Admin') && !allowedRoles.includes('Super Admin')) {
            allowedRoles.push('Super Admin');
        }
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'You do not have permission to access this resource',
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
