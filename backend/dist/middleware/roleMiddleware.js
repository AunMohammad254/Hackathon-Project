"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role (${req.user?.role || 'unknown'}) is not allowed to access this resource`,
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
