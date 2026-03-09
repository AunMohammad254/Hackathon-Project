import { Response } from 'express';
import { z } from 'zod';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';
import { AuthRequest } from '../middleware/authMiddleware';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

const createAppointmentSchema = z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
    date: z.string().min(1, 'Date is required'),
    patientId: z.string().optional(), // Receptionist/Admin can specify; Patients auto-resolve
});

const updateStatusSchema = z.object({
    status: z.enum(VALID_STATUSES),
});

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Admin, Receptionist, Patient, Doctor)
export const createAppointment = async (req: AuthRequest, res: Response) => {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { doctorId, date, patientId: bodyPatientId } = parsed.data;

    try {
        let patientId: string;

        if (req.user!.role === 'Patient') {
            // BUG-02 FIX: For patients, look up their Patient record via createdBy link
            const patient = await Patient.findOne({ createdBy: req.user!._id }).lean();
            if (!patient) {
                // If the patient profile does not exist yet, return a clean 404
                return res.status(404).json({ message: 'Patient profile incomplete' });
            } else {
                patientId = patient._id.toString();
            }
        } else if (bodyPatientId) {
            // Admin/Receptionist/Doctor can specify patientId explicitly
            patientId = bodyPatientId;
        } else {
            return res.status(400).json({ message: 'patientId is required for non-patient users' });
        }

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

// @desc    Get appointments (role-filtered)
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req: AuthRequest, res: Response) => {
    try {
        let query: Record<string, unknown> = {};

        if (req.user!.role === 'Doctor') {
            query = { doctorId: req.user!._id };
        } else if (req.user!.role === 'Patient') {
            // Find all Patient records owned by this user
            const patientRecords = await Patient.find({ createdBy: req.user!._id }).select('_id').lean();
            const patientIds = patientRecords.map(p => p._id);
            if (patientIds.length === 0) {
                return res.json([]);
            }
            query = { patientId: { $in: patientIds } };
        }
        // Admin/Receptionist see all

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name age contact')
            .populate('doctorId', 'name email')
            .sort({ date: -1 })
            .lean();

        res.json(appointments);
    } catch (error) {
        console.error('[Get Appointments Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get individual patient's appointments (Medical History Timeline)
// @route   GET /api/appointments/patient/:patientId
// @access  Private — SEC-02 FIX: ownership verified
export const getPatientAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;

        // SEC-02 FIX: Verify the requesting user has access to this patient's data
        if (req.user!.role === 'Patient') {
            const patient = await Patient.findById(patientId).lean();
            if (!patient || patient.createdBy.toString() !== req.user!._id) {
                return res.status(403).json({ message: 'Access denied: you can only view your own appointments' });
            }
        } else if (req.user!.role === 'Doctor') {
            // Doctors can only see appointments where they are the assigned doctor
            const hasAccess = await Appointment.exists({ patientId, doctorId: req.user!._id });
            if (!hasAccess) {
                return res.status(403).json({ message: 'Access denied: patient not assigned to you' });
            }
        }
        // Admin/Receptionist have full access — no additional check needed

        const appointments = await Appointment.find({ patientId })
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
// @access  Private (Admin, Receptionist, Doctor, Patient for cancellation)
export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
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

