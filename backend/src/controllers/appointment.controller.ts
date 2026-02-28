import { Response } from 'express';
import { z } from 'zod';
import Appointment from '../models/Appointment';
import { AuthRequest } from '../middleware/authMiddleware';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

const createAppointmentSchema = z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    doctorId: z.string().min(1, 'Doctor ID is required'),
    date: z.string().min(1, 'Date is required'),
});

const updateStatusSchema = z.object({
    status: z.enum(VALID_STATUSES),
});

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Admin, Receptionist, Patient)
export const createAppointment = async (req: AuthRequest, res: Response) => {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { patientId, doctorId, date } = parsed.data;

    try {
        const appointment = new Appointment({
            patientId,
            doctorId,
            date,
            status: 'pending',
        });

        const createdAppointment = await appointment.save();
        res.status(201).json(createdAppointment);
    } catch (error) {
        console.error('[Create Appointment Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req: AuthRequest, res: Response) => {
    try {
        let query: Record<string, unknown> = {};

        // Filter based on role
        if (req.user!.role === 'Doctor') {
            query = { doctorId: req.user!._id };
        } else if (req.user!.role === 'Patient') {
            // BUG-05: If a patientId is provided, filter by it;
            // otherwise return empty (don't expose all appointments)
            if (req.query.patientId) {
                query = { patientId: req.query.patientId };
            } else {
                return res.json([]);
            }
        }
        // Admin/Receptionist see all

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name age contact')
            .populate('doctorId', 'name email')
            .lean();

        res.json(appointments);
    } catch (error) {
        console.error('[Get Appointments Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get individual patient's appointments (Medical History Timeline)
// @route   GET /api/appointments/patient/:patientId
// @access  Private
export const getPatientAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const appointments = await Appointment.find({ patientId: req.params.patientId })
            .populate('doctorId', 'name')
            .sort({ date: -1 })
            .lean();

        res.json(appointments);
    } catch (error) {
        console.error('[Get Patient Appointments Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin, Receptionist, Doctor)
export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
    // BUG-02: Validate status enum before database call
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
    }

    const { status } = parsed.data;

    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.status = status;
        const updatedAppointment = await appointment.save();
        res.json(updatedAppointment);
    } catch (error) {
        console.error('[Update Appointment Status Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};
