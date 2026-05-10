import { Response } from 'express';
import { z } from 'zod';
import Appointment, { IAppointmentDocument } from '../models/Appointment';
import Patient, { IPatientDocument } from '../models/Patient';
import User, { IUserDocument } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { emitToUser, emitToRole } from '../services/socket.service';
import { generateInvoicePDF } from '../services/invoice.service';
import { uploadInvoicePDF } from '../services/supabase.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

const createAppointmentSchema = z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
    date: z.string().min(1, 'Date is required'),
    patientId: z.string().optional(), // Receptionist/Admin can specify; Patients auto-resolve
    reason: z.string().optional(),
    symptoms: z.string().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(VALID_STATUSES),
});

// Helper: Clean JSON response from Gemini
const cleanJsonResponse = (text: string) => {
    return text.replace(/```json/gi, '').replace(/```/g, '').trim();
};

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

    const { doctorId, date, patientId: bodyPatientId, reason, symptoms } = parsed.data;

    try {
        let patientId: string;
        let patientData: any = null;

        if (req.user!.role === 'Patient') {
            // BUG-02 FIX: For patients, look up their Patient record via createdBy link
            patientData = await Patient.findOne({ createdBy: req.user!._id });
            if (!patientData) {
                // If the patient profile does not exist yet (e.g. registered before auto-create was added), auto-create one
                patientData = await Patient.create({
                    name: req.user!.name,
                    age: 0,
                    gender: 'Other',
                    contact: req.user!.email,
                    createdBy: req.user!._id
                });
            }
            patientId = patientData._id.toString();
        } else if (bodyPatientId) {
            // Admin/Receptionist/Doctor can specify patientId explicitly
            patientData = await Patient.findById(bodyPatientId);
            patientId = bodyPatientId;
        } else {
            return res.status(400).json({ success: false, message: 'patientId is required for non-patient users' });
        }

        let aiPreDiagnosis = undefined;

        if (symptoms) {
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const prompt = `
                    Analyze the following patient symptoms and provide a smart pre-diagnosis for the doctor.
                    Patient: ${patientData?.name}, Age: ${patientData?.age}, Gender: ${patientData?.gender}
                    Symptoms: ${symptoms}
                    
                    Provide the analysis strictly as a JSON object with:
                    {
                        "possibleConditions": ["string"],
                        "riskLevel": "Low" | "Medium" | "High" | "Critical",
                        "urgency": "string",
                        "advice": "string"
                    }
                    Output ONLY the JSON.
                `;
                const result = await model.generateContent(prompt);
                const responseText = cleanJsonResponse(result.response.text());
                aiPreDiagnosis = JSON.parse(responseText);
            } catch (aiErr) {
                console.error('[Gemini AI Pre-Diagnosis Error]', aiErr);
                // Continue without AI if it fails
            }
        }

        const appointment = new Appointment({
            patientId,
            doctorId,
            date,
            status: 'pending',
            reason,
            symptoms,
            aiPreDiagnosis
        });

        const createdAppointment = await appointment.save();

        // Notify Doctor
        emitToUser(doctorId, 'appointment-created', {
            appointment: createdAppointment,
            message: `New appointment scheduled for ${date}${aiPreDiagnosis ? ' (with AI Pre-Diagnosis)' : ''}`
        });

        // Notify Admins/Receptionists
        emitToRole('Admin', 'appointment-created', { appointment: createdAppointment });
        emitToRole('Receptionist', 'appointment-created', { appointment: createdAppointment });

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
            dbQuery = dbQuery.skip(skip).limit(limit);
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
            dbQuery = dbQuery.skip(skip).limit(limit);
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

        // Generate Invoice if completed
        if (status === 'completed' && !appointment.invoiceUrl) {
            try {
                const patientData = await Patient.findById(appointment.patientId).lean() as IPatientDocument;
                const doctorData = await User.findById(appointment.doctorId).lean() as IUserDocument;
                
                if (patientData && doctorData) {
                    const invoiceBuffer = await generateInvoicePDF(appointment as IAppointmentDocument, patientData, doctorData);
                    const fileName = `invoice-${appointment._id}-${Date.now()}.pdf`;
                    const invoiceUrl = await uploadInvoicePDF(invoiceBuffer, fileName);
                    appointment.invoiceUrl = invoiceUrl;
                }
            } catch (invoiceErr) {
                console.error('[Invoice Generation Error]', invoiceErr);
                // Don't fail the whole request if invoice fails
            }
        }

        const updatedAppointment = await appointment.save();

        // Notify Patient
        const patient = await Patient.findById(appointment.patientId).select('createdBy').lean();
        if (patient) {
            emitToUser(patient.createdBy.toString(), 'appointment-updated', {
                appointment: updatedAppointment,
                message: `Your appointment status has been updated to ${status}`
            });
        }

        // Notify Doctor
        emitToUser(appointment.doctorId.toString(), 'appointment-updated', {
            appointment: updatedAppointment,
            message: `Appointment status updated to ${status}`
        });

        res.json(updatedAppointment);
    } catch (error: unknown) {
        console.error('[Update Appointment Status Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

