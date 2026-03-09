import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
    id: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: {
        _id: string;
        name: string;
        email: string;
        role: string;
        subscriptionPlan?: string;
    };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        const user = await User.findById(decoded.id).select('-password').lean();
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        req.user = {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            subscriptionPlan: user.subscriptionPlan,
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
