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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user!._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error: unknown) {
        console.error('[Update Profile Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
};
