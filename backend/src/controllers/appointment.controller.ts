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
    reason: z.string().optional(),
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
            success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { doctorId, date, patientId: bodyPatientId, reason } = parsed.data;

    try {
        let patientId: string;

        if (req.user!.role === 'Patient') {
            // BUG-02 FIX: For patients, look up their Patient record via createdBy link
            let patient = await Patient.findOne({ createdBy: req.user!._id }).lean();
            if (!patient) {
                // If the patient profile does not exist yet (e.g. registered before auto-create was added), auto-create one
                const newPatient = await Patient.create({
                    name: req.user!.name,
                    age: 0,
                    gender: 'Other',
                    contact: req.user!.email,
                    createdBy: req.user!._id
                });
                patientId = newPatient._id.toString();
            } else {
                patientId = patient._id.toString();
            }
        } else if (bodyPatientId) {
            // Admin/Receptionist/Doctor can specify patientId explicitly
            patientId = bodyPatientId;
        } else {
            return res.status(400).json({ success: false, message: 'patientId is required for non-patient users' });
        }

        const appointment = new Appointment({
            patientId,
            doctorId,
            date,
            status: 'pending',
            reason,
        });

        const createdAppointment = await appointment.save();
        res.status(201).json({
            success: true,
            appointment: createdAppointment
        });
    } catch (error: unknown) {
        console.error('[Create Appointment Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
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
                return res.json({ success: true, appointments: [] });
            }
            query = { patientId: { $in: patientIds } };
        }
        // Admin/Receptionist see all

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 0; // 0 = no limit (backward compatible)
        const skip = (page - 1) * limit;

        let dbQuery = Appointment.find(query)
            .populate('patientId', 'name age contact')
            .populate('doctorId', 'name email')
            .sort({ date: -1 });

        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit) as any;
        }

        const appointments = await dbQuery.lean();

        res.json({ success: true, appointments });
    } catch (error: unknown) {
        console.error('[Get Appointments Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
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
                return res.status(403).json({ success: false, message: 'Access denied: you can only view your own appointments' });
            }
        } else if (req.user!.role === 'Doctor') {
            // Doctors can only see appointments where they are the assigned doctor
            const hasAccess = await Appointment.exists({ patientId, doctorId: req.user!._id });
            if (!hasAccess) {
                return res.status(403).json({ success: false, message: 'Access denied: patient not assigned to you' });
            }
        }
        // Admin/Receptionist have full access — no additional check needed

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 0;
        const skip = (page - 1) * limit;

        let dbQuery = Appointment.find({ patientId })
            .populate('doctorId', 'name')
            .sort({ date: -1 });

        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit) as any;
        }

        const appointments = await dbQuery.lean();

        res.json({ success: true, appointments });
    } catch (error: unknown) {
        console.error('[Get Patient Appointments Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin, Receptionist, Doctor, Patient for cancellation)
export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, });
    }

    const { status } = parsed.data;

    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        appointment.status = status;
        const updatedAppointment = await appointment.save();
        res.json(updatedAppointment);
    } catch (error: unknown) {
        console.error('[Update Appointment Status Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

