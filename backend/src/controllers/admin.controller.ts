import { Response } from 'express';
import { z } from 'zod';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import Prescription from '../models/Prescription';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const DiagnosisLog = (await import('../models/DiagnosisLog')).default;

        const [
            totalPatients,
            totalAppointments,
            totalPrescriptions,
            totalDoctors,
            pendingAppointments,
            confirmedAppointments,
            completedAppointments,
            recentAppointments,
            monthlyTrends,
            topDiagnoses,
        ] = await Promise.all([
            Patient.countDocuments(),
            Appointment.countDocuments(),
            Prescription.countDocuments(),
            User.countDocuments({ role: 'Doctor' }),
            Appointment.countDocuments({ status: 'pending' }),
            Appointment.countDocuments({ status: 'confirmed' }),
            Appointment.countDocuments({ status: 'completed' }),
            Appointment.find()
                .populate('patientId', 'name contact')
                .populate('doctorId', 'name')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            // Monthly appointment trends (last 6 months)
            Appointment.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Top 5 diagnoses
            DiagnosisLog.aggregate([
                { $match: { riskLevel: { $exists: true } } },
                {
                    $group: {
                        _id: '$riskLevel',
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]),
        ]);

        // Simulated revenue: ₹500 per completed appointment
        const simulatedRevenue = completedAppointments * 500;

        res.status(200).json({
            success: true,
            stats: {
                totalPatients,
                totalAppointments,
                totalPrescriptions,
                totalDoctors,
                simulatedRevenue,
                breakdown: {
                    pending: pendingAppointments,
                    confirmed: confirmedAppointments,
                    completed: completedAppointments,
                },
            },
            monthlyTrends,
            topDiagnoses,
            recentActivity: recentAppointments,
        });
    } catch (error) {
        console.error('[Admin Stats Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users (staff management)
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
        res.json({ success: true, users });
    } catch (error) {
        console.error('[Get Users Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateRoleSchema = z.object({
    role: z.enum(['Admin', 'Doctor', 'Receptionist', 'Patient']),
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
export const updateUserRole = async (req: AuthRequest, res: Response) => {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: 'Invalid role. Must be one of: Admin, Doctor, Receptionist, Patient',
        });
    }

    const { role } = parsed.data;

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: `Role updated to ${role}`,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error('[Update Role Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user!._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // SEC-07 FIX: Use a transaction for cascade delete to ensure atomicity
        const mongoose = (await import('mongoose')).default;
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                // Find all Patient records created by this user
                const patientRecords = await Patient.find({ createdBy: user._id }).select('_id').session(session).lean();
                const patientIds = patientRecords.map(p => p._id);

                // Delete appointments where user is doctor OR patient
                await Appointment.deleteMany({
                    $or: [
                        { doctorId: user._id },
                        { patientId: { $in: patientIds } },
                    ],
                }, { session });

                // Delete prescriptions where user is doctor OR patient
                await Prescription.deleteMany({
                    $or: [
                        { doctorId: user._id },
                        { patientId: { $in: patientIds } },
                    ],
                }, { session });

                // Delete patient records created by this user
                await Patient.deleteMany({ createdBy: user._id }, { session });

                // Delete the user
                await User.findByIdAndDelete(user._id, { session });
            });
        } finally {
            await session.endSession();
        }

        res.json({ success: true, message: 'User and related data deleted successfully' });
    } catch (error) {
        console.error('[Delete User Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSubscriptionSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    plan: z.enum(['Free', 'Pro']),
});

// @desc    Update a user's subscription plan
// @route   PUT /api/admin/subscription
// @access  Private (Admin)
export const updateSubscriptionPlan = async (req: AuthRequest, res: Response) => {
    const parsed = updateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: 'Invalid input data',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    try {
        const { userId, plan } = parsed.data;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.subscriptionPlan = plan;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User upgraded to ${plan} plan successfully`,
            user: { _id: user._id, name: user.name, subscriptionPlan: user.subscriptionPlan }
        });
    } catch (error) {
        console.error('[Update Subscription Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};
