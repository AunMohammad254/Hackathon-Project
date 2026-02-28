import { Request, Response } from 'express';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import Prescription from '../models/Prescription';
import User from '../models/User';

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        const totalPrescriptions = await Prescription.countDocuments();
        const totalDoctors = await User.countDocuments({ role: 'Doctor' });

        const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
        const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
        const completedAppointments = await Appointment.countDocuments({ status: 'completed' });

        const recentAppointments = await Appointment.find()
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

    } catch (error: any) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ message: 'Server error retrieving stats', error: error.message });
    }
};

// @desc    Get all users (staff management)
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
export const updateUserRole = async (req: Request, res: Response) => {
    const { role } = req.body;
    const validRoles = ['Admin', 'Doctor', 'Receptionist', 'Patient'];

    if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({ success: true, message: `Role updated to ${role}`, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.deleteOne();
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
