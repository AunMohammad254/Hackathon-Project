"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const Patient_1 = __importDefault(require("../models/Patient"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Prescription_1 = __importDefault(require("../models/Prescription"));
const User_1 = __importDefault(require("../models/User"));
const getDashboardStats = async (req, res) => {
    try {
        // 1. Core Counts
        const totalPatients = await Patient_1.default.countDocuments();
        const totalAppointments = await Appointment_1.default.countDocuments();
        const totalPrescriptions = await Prescription_1.default.countDocuments();
        const totalDoctors = await User_1.default.countDocuments({ role: 'Doctor' });
        // 2. Appointment Breakdown
        const pendingAppointments = await Appointment_1.default.countDocuments({ status: 'pending' });
        const confirmedAppointments = await Appointment_1.default.countDocuments({ status: 'confirmed' });
        const completedAppointments = await Appointment_1.default.countDocuments({ status: 'completed' });
        // 3. Recent Activity (Latest 5 Appointments)
        const recentAppointments = await Appointment_1.default.find()
            .populate('patientId', 'name contact')
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);
        res.status(200).json({
            success: true,
            stats: {
                totalPatients,
                totalAppointments,
                totalPrescriptions,
                totalDoctors,
                breakdown: {
                    pending: pendingAppointments,
                    confirmed: confirmedAppointments,
                    completed: completedAppointments
                }
            },
            recentActivity: recentAppointments
        });
    }
    catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ message: 'Server error retrieving stats', error: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
