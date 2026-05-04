import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import Prescription from '../models/Prescription';
import User from '../models/User';
import DiagnosisLog from '../models/DiagnosisLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { adminStatsCache, doctorCache } from '../services/cache';

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const cachedStats = adminStatsCache.get('dashboard_stats');
        if (cachedStats) {
            return res.status(200).json(cachedStats);
        }

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // DiagnosisLog imported statically at top

        const [
            totalPatients,
            totalAppointments,
            totalPrescriptions,
            totalDoctors,
            statusBreakdown,
            recentAppointments,
            monthlyTrends,
            topDiagnoses,
        ] = await Promise.all([
            Patient.countDocuments(),
            Appointment.countDocuments(),
            Prescription.countDocuments(),
            User.countDocuments({ role: 'Doctor' }),
            Appointment.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
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

        // Map status breakdown array to object
        const breakdown: Record<string, number> = {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
        };
        statusBreakdown.forEach((item: any) => {
            if (item._id) breakdown[item._id] = item.count;
        });

        // Simulated revenue: ₹500 per completed appointment
        const simulatedRevenue = breakdown.completed * 500;

        const responsePayload = {
            success: true,
            stats: {
                totalPatients,
                totalAppointments,
                totalPrescriptions,
                totalDoctors,
                simulatedRevenue,
                breakdown,
            },
            monthlyTrends,
            topDiagnoses,
            recentActivity: recentAppointments,
        };

        adminStatsCache.set('dashboard_stats', responsePayload, 2 * 60 * 1000); // 2 min TTL
        res.status(200).json(responsePayload);
    } catch (error: unknown) {
        console.error('[Admin Stats Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all users (staff management)
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 0;
        const skip = (page - 1) * limit;

        let dbQuery = User.find({}).select('-password').sort({ createdAt: -1 });

        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit);
        }

        const users = await dbQuery.lean();
        res.json({ success: true, users });
    } catch (error: unknown) {
        console.error('[Get Users Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
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
        return res.status(400).json({ success: false, message: 'Invalid role. Must be one of: Admin, Doctor, Receptionist, Patient', });
    }

    const { role } = parsed.data;

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // If user is becoming a doctor or was a doctor, invalidate doctor cache
        if (oldRole === 'Doctor' || role === 'Doctor') {
            doctorCache.invalidate('all_doctors');
        }

        res.json({
            success: true,
            message: `Role updated to ${role}`,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error: unknown) {
        console.error('[Update Role Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user!._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        // SEC-07 FIX: Use a transaction for cascade delete to ensure atomicity
        // mongoose imported statically at top
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
    } catch (error: unknown) {
        console.error('[Delete User Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
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
            success: false, message: 'Invalid input data',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    try {
        const { userId, plan } = parsed.data;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.subscriptionPlan = plan;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User upgraded to ${plan} plan successfully`,
            user: { _id: user._id, name: user.name, subscriptionPlan: user.subscriptionPlan }
        });
    } catch (error: unknown) {
        console.error('[Update Subscription Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all pending users (Super Admin / Admin)
// @route   GET /api/admin/users/pending
// @access  Private (Admin, Super Admin)
export const getPendingUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find({ status: 'Pending' }).select('-password').sort({ createdAt: -1 }).lean();
        res.json({ success: true, users });
    } catch (error: unknown) {
        console.error('[Get Pending Users Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateStatusSchema = z.object({
    status: z.enum(['Approved', 'Rejected']),
});

// @desc    Get all orders (appointments with financials)
// @route   GET /api/admin/orders
// @access  Private (Admin)
export const getAllOrders = async (req: AuthRequest, res: Response) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
        const query: any = {};

        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            Appointment.find(query)
                .populate('patientId', 'name contact')
                .populate('doctorId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Appointment.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: {
                orders,
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: unknown) {
        console.error('[Get Orders Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get advanced financial analytics
// @route   GET /api/admin/financials
// @access  Private (Admin)
export const getFinancialAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { timeframe = 'monthly' } = req.query; // daily, monthly, hourly
        
        let groupFormat = '%Y-%m';
        if (timeframe === 'daily') groupFormat = '%Y-%m-%d';
        if (timeframe === 'hourly') groupFormat = '%Y-%m-%d %H:00';

        const stats = await Appointment.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
                    revenue: { $sum: '$price' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const totalRevenue = stats.reduce((acc, curr) => acc + curr.revenue, 0);

        res.json({
            success: true,
            data: {
                totalRevenue,
                breakdown: stats,
                timeframe,
            },
        });
    } catch (error: unknown) {
        console.error('[Financial Analytics Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user status (Approve/Reject)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Super Admin)
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved or Rejected' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        (user as any).status = parsed.data.status;
        await user.save();

        if (user.role === 'Doctor' && parsed.data.status === 'Approved') {
            doctorCache.invalidate('all_doctors');
        }

        res.json({
            success: true,
            message: `User status updated to ${parsed.data.status}`,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: (user as any).status },
        });
    } catch (error: unknown) {
        console.error('[Update Status Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
