import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

/**
 * Middleware to gate AI features behind the "Pro" subscription plan.
 * Free users receive a 403 with an upgrade prompt.
 */
export const requireProPlan = (req: AuthRequest, res: Response, next: NextFunction) => {
    const plan = (req.user as any)?.subscriptionPlan || 'Free';

    if (plan !== 'Pro') {
        return res.status(403).json({
            success: false,
            message: 'This feature requires a Pro subscription. Please upgrade your plan.',
            upgradeRequired: true,
        });
    }

    next();
};
