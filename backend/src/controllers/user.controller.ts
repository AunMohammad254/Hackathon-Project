import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Private
export const getDoctors = async (req: AuthRequest, res: Response) => {
    try {
        const doctors = await User.find({ role: 'Doctor' })
            .select('name email _id')
            .lean();
        res.json(doctors);
    } catch (error) {
        console.error('[Get Doctors Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error fetching doctors' });
    }
};
