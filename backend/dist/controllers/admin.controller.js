"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.getDashboardStats = void 0;
const zod_1 = require("zod");
const Patient_1 = __importDefault(require("../models/Patient"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Prescription_1 = __importDefault(require("../models/Prescription"));
const User_1 = __importDefault(require("../models/User"));
// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const DiagnosisLog = (await Promise.resolve().then(() => __importStar(require('../models/DiagnosisLog')))).default;
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
    }
    catch (error) {
        console.error('[Admin Stats Error]', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getDashboardStats = getDashboardStats;
// @desc    Get all users (staff management)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.default.find({}).select('-password').sort({ createdAt: -1 }).lean();
        res.json({ success: true, users });
    }
    catch (error) {
        console.error('[Get Users Error]', error.message);
        res.status(500).json({ message: 'Server error' });
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
        return res.status(400).json({
            message: 'Invalid role. Must be one of: Admin, Doctor, Receptionist, Patient',
        });
    }
    const { role } = parsed.data;
    try {
        const user = await User_1.default.findById(req.params.id);
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
    }
    catch (error) {
        console.error('[Update Role Error]', error.message);
        res.status(500).json({ message: 'Server error' });
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
            return res.status(404).json({ message: 'User not found' });
        }
        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        // BUG-03: Cascade cleanup — remove related data
        await Promise.all([
            Appointment_1.default.deleteMany({
                $or: [{ doctorId: user._id }, { patientId: user._id }],
            }),
            Prescription_1.default.deleteMany({
                $or: [{ doctorId: user._id }, { patientId: user._id }],
            }),
            user.deleteOne(),
        ]);
        res.json({ success: true, message: 'User and related data deleted successfully' });
    }
    catch (error) {
        console.error('[Delete User Error]', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
