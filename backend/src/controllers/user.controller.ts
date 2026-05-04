import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { doctorCache } from '../services/cache';

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Private
export const getDoctors = async (req: AuthRequest, res: Response) => {
    try {
        const cachedDoctors = doctorCache.get('all_doctors');
        if (cachedDoctors) {
            return res.status(200).json(cachedDoctors);
        }

        const doctors = await User.find({ role: 'Doctor' })
            .select('name email _id')
            .lean();
            
        const responseData = { success: true, doctors };
        doctorCache.set('all_doctors', responseData, 5 * 60 * 1000); // 5 min TTL
        res.status(200).json(responseData);
    } catch (error: unknown) {
        console.error('[Get Doctors Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error fetching doctors' });
    }
};
