import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
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
