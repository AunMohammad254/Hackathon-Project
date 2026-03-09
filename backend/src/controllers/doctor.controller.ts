import { Response } from 'express';
import Appointment from '../models/Appointment';
import Prescription from '../models/Prescription';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get doctor analytics
// @route   GET /api/doctor/analytics
// @access  Private (Doctor)
export const getDoctorAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const doctorId = req.user!._id;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const [
            dailyAppointments,
            totalAppointments,
            totalPrescriptions,
            monthlyStats,
            recentAppointments
        ] = await Promise.all([
            // Daily appointments
            Appointment.countDocuments({
                doctorId,
                date: { $gte: startOfDay, $lte: endOfDay }
            }),
            // Total appointments
            Appointment.countDocuments({ doctorId }),
            // Total prescriptions
            Prescription.countDocuments({ doctorId }),
            // Monthly appointments
            Appointment.aggregate([
                { $match: { doctorId, createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Recent Feed
            Appointment.find({ doctorId })
                .populate('patientId', 'name contact')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean()
        ]);

        res.status(200).json({
            success: true,
            stats: {
                dailyAppointments,
                totalAppointments,
                totalPrescriptions,
            },
            monthlyStats,
            recentActivity: recentAppointments,
        });
    } catch (error: unknown) {
        console.error('[Doctor Analytics Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
