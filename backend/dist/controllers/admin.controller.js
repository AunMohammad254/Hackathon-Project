"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserStatus = exports.getPendingUsers = exports.updateSubscriptionPlan = exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.getDashboardStats = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Prescription_1 = __importDefault(require("../models/Prescription"));
const User_1 = __importDefault(require("../models/User"));
const DiagnosisLog_1 = __importDefault(require("../models/DiagnosisLog"));
const cache_1 = require("../services/cache");
// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
    try {
        const cachedStats = cache_1.adminStatsCache.get('dashboard_stats');
        if (cachedStats) {
            return res.status(200).json(cachedStats);
        }
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        // DiagnosisLog imported statically at top
        const [totalPatients, totalAppointments, totalPrescriptions, totalDoctors, pendingAppointments, confirmedAppointments, completedAppointments, recentAppointments, monthlyTrends, topDiagnoses,] = await Promise.all([
            Patient_1.default.countDocuments(),
            Appointment_1.default.countDocuments(),
            Prescription_1.default.countDocuments(),
            User_1.default.countDocuments({ role: 'Doctor' }),
            Appointment_1.default.countDocuments({ status: 'pending' }),
            Appointment_1.default.countDocuments({ status: 'confirmed' }),
            Appointment_1.default.countDocuments({ status: 'completed' }),
            Appointment_1.default.find()
                .populate('patientId', 'name contact')
                .populate('doctorId', 'name')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            // Monthly appointment trends (last 6 months)
            Appointment_1.default.aggregate([
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
            DiagnosisLog_1.default.aggregate([
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
        const responsePayload = {
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
        };
        cache_1.adminStatsCache.set('dashboard_stats', responsePayload, 2 * 60 * 1000); // 2 min TTL
        res.status(200).json(responsePayload);
    }
    catch (error) {
        console.error('[Admin Stats Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getDashboardStats = getDashboardStats;
// @desc    Get all users (staff management)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const skip = (page - 1) * limit;
        let dbQuery = User_1.default.find({}).select('-password').sort({ createdAt: -1 });
        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit);
        }
        const users = await dbQuery.lean();
        res.json({ success: true, users });
    }
    catch (error) {
        console.error('[Get Users Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getAllUsers = getAllUsers;
const updateRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['Admin', 'Doctor', 'Receptionist', 'Patient']),
});
// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Invalid role. Must be one of: Admin, Doctor, Receptionist, Patient', });
    }
    const { role } = parsed.data;
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const oldRole = user.role;
        user.role = role;
        await user.save();
        // If user is becoming a doctor or was a doctor, invalidate doctor cache
        if (oldRole === 'Doctor' || role === 'Doctor') {
            cache_1.doctorCache.invalidate('all_doctors');
        }
        res.json({
            success: true,
            message: `Role updated to ${role}`,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        console.error('[Update Role Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateUserRole = updateUserRole;
// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        // SEC-07 FIX: Use a transaction for cascade delete to ensure atomicity
        // mongoose imported statically at top
        const session = await mongoose_1.default.startSession();
        try {
            await session.withTransaction(async () => {
                // Find all Patient records created by this user
                const patientRecords = await Patient_1.default.find({ createdBy: user._id }).select('_id').session(session).lean();
                const patientIds = patientRecords.map(p => p._id);
                // Delete appointments where user is doctor OR patient
                await Appointment_1.default.deleteMany({
                    $or: [
                        { doctorId: user._id },
                        { patientId: { $in: patientIds } },
                    ],
                }, { session });
                // Delete prescriptions where user is doctor OR patient
                await Prescription_1.default.deleteMany({
                    $or: [
                        { doctorId: user._id },
                        { patientId: { $in: patientIds } },
                    ],
                }, { session });
                // Delete patient records created by this user
                await Patient_1.default.deleteMany({ createdBy: user._id }, { session });
                // Delete the user
                await User_1.default.findByIdAndDelete(user._id, { session });
            });
        }
        finally {
            await session.endSession();
        }
        res.json({ success: true, message: 'User and related data deleted successfully' });
    }
    catch (error) {
        console.error('[Delete User Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
const updateSubscriptionSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    plan: zod_1.z.enum(['Free', 'Pro']),
});
// @desc    Update a user's subscription plan
// @route   PUT /api/admin/subscription
// @access  Private (Admin)
const updateSubscriptionPlan = async (req, res) => {
    const parsed = updateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false, message: 'Invalid input data',
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        const { userId, plan } = parsed.data;
        const user = await User_1.default.findById(userId);
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
    }
    catch (error) {
        console.error('[Update Subscription Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateSubscriptionPlan = updateSubscriptionPlan;
// @desc    Get all pending users (Super Admin / Admin)
// @route   GET /api/admin/users/pending
// @access  Private (Admin, Super Admin)
const getPendingUsers = async (req, res) => {
    try {
        const users = await User_1.default.find({ status: 'Pending' }).select('-password').sort({ createdAt: -1 }).lean();
        res.json({ success: true, users });
    }
    catch (error) {
        console.error('[Get Pending Users Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getPendingUsers = getPendingUsers;
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['Approved', 'Rejected']),
});
// @desc    Update user status (Approve/Reject)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Super Admin)
const updateUserStatus = async (req, res) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved or Rejected' });
    }
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.status = parsed.data.status;
        await user.save();
        if (user.role === 'Doctor' && parsed.data.status === 'Approved') {
            cache_1.doctorCache.invalidate('all_doctors');
        }
        res.json({
            success: true,
            message: `User status updated to ${parsed.data.status}`,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
        });
    }
    catch (error) {
        console.error('[Update Status Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateUserStatus = updateUserStatus;
