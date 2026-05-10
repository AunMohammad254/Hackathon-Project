"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppointmentStatus = exports.getPatientAppointments = exports.getAppointments = exports.createAppointment = void 0;
const zod_1 = require("zod");
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Patient_1 = __importDefault(require("../models/Patient"));
const User_1 = __importDefault(require("../models/User"));
const socket_service_1 = require("../services/socket.service");
const invoice_service_1 = require("../services/invoice.service");
const supabase_service_1 = require("../services/supabase.service");
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const createAppointmentSchema = zod_1.z.object({
    doctorId: zod_1.z.string().min(1, 'Doctor ID is required'),
    date: zod_1.z.string().min(1, 'Date is required'),
    patientId: zod_1.z.string().optional(), // Receptionist/Admin can specify; Patients auto-resolve
    reason: zod_1.z.string().optional(),
    symptoms: zod_1.z.string().optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(VALID_STATUSES),
});
// Helper: Clean JSON response from Gemini
const cleanJsonResponse = (text) => {
    return text.replace(/```json/gi, '').replace(/```/g, '').trim();
};
// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Admin, Receptionist, Patient, Doctor)
const createAppointment = async (req, res) => {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    const { doctorId, date, patientId: bodyPatientId, reason, symptoms } = parsed.data;
    try {
        let patientId;
        let patientData = null;
        if (req.user.role === 'Patient') {
            // BUG-02 FIX: For patients, look up their Patient record via createdBy link
            patientData = await Patient_1.default.findOne({ createdBy: req.user._id });
            if (!patientData) {
                // If the patient profile does not exist yet (e.g. registered before auto-create was added), auto-create one
                patientData = await Patient_1.default.create({
                    name: req.user.name,
                    age: 0,
                    gender: 'Other',
                    contact: req.user.email,
                    createdBy: req.user._id
                });
            }
            patientId = patientData._id.toString();
        }
        else if (bodyPatientId) {
            // Admin/Receptionist/Doctor can specify patientId explicitly
            patientData = await Patient_1.default.findById(bodyPatientId);
            patientId = bodyPatientId;
        }
        else {
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
            }
            catch (aiErr) {
                console.error('[Gemini AI Pre-Diagnosis Error]', aiErr);
                // Continue without AI if it fails
            }
        }
        const appointment = new Appointment_1.default({
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
        (0, socket_service_1.emitToUser)(doctorId, 'appointment-created', {
            appointment: createdAppointment,
            message: `New appointment scheduled for ${date}${aiPreDiagnosis ? ' (with AI Pre-Diagnosis)' : ''}`
        });
        // Notify Admins/Receptionists
        (0, socket_service_1.emitToRole)('Admin', 'appointment-created', { appointment: createdAppointment });
        (0, socket_service_1.emitToRole)('Receptionist', 'appointment-created', { appointment: createdAppointment });
        res.status(201).json({
            success: true,
            appointment: createdAppointment
        });
    }
    catch (error) {
        console.error('[Create Appointment Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.createAppointment = createAppointment;
// @desc    Get appointments (role-filtered)
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'Doctor') {
            query = { doctorId: req.user._id };
        }
        else if (req.user.role === 'Patient') {
            // Find all Patient records owned by this user
            const patientRecords = await Patient_1.default.find({ createdBy: req.user._id }).select('_id').lean();
            const patientIds = patientRecords.map(p => p._id);
            if (patientIds.length === 0) {
                return res.json({ success: true, appointments: [] });
            }
            query = { patientId: { $in: patientIds } };
        }
        // Admin/Receptionist see all
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0; // 0 = no limit (backward compatible)
        const skip = (page - 1) * limit;
        let dbQuery = Appointment_1.default.find(query)
            .populate('patientId', 'name age contact')
            .populate('doctorId', 'name email')
            .sort({ date: -1 });
        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit);
        }
        const appointments = await dbQuery.lean();
        res.json({ success: true, appointments });
    }
    catch (error) {
        console.error('[Get Appointments Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getAppointments = getAppointments;
// @desc    Get individual patient's appointments (Medical History Timeline)
// @route   GET /api/appointments/patient/:patientId
// @access  Private — SEC-02 FIX: ownership verified
const getPatientAppointments = async (req, res) => {
    try {
        const { patientId } = req.params;
        // SEC-02 FIX: Verify the requesting user has access to this patient's data
        if (req.user.role === 'Patient') {
            const patient = await Patient_1.default.findById(patientId).lean();
            if (!patient || patient.createdBy.toString() !== req.user._id) {
                return res.status(403).json({ success: false, message: 'Access denied: you can only view your own appointments' });
            }
        }
        else if (req.user.role === 'Doctor') {
            // Doctors can only see appointments where they are the assigned doctor
            const hasAccess = await Appointment_1.default.exists({ patientId, doctorId: req.user._id });
            if (!hasAccess) {
                return res.status(403).json({ success: false, message: 'Access denied: patient not assigned to you' });
            }
        }
        // Admin/Receptionist have full access — no additional check needed
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const skip = (page - 1) * limit;
        let dbQuery = Appointment_1.default.find({ patientId })
            .populate('doctorId', 'name')
            .sort({ date: -1 });
        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit);
        }
        const appointments = await dbQuery.lean();
        res.json({ success: true, appointments });
    }
    catch (error) {
        console.error('[Get Patient Appointments Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getPatientAppointments = getPatientAppointments;
// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin, Receptionist, Doctor, Patient for cancellation)
const updateAppointmentStatus = async (req, res) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, });
    }
    const { status } = parsed.data;
    try {
        const appointment = await Appointment_1.default.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        appointment.status = status;
        // Generate Invoice if completed
        if (status === 'completed' && !appointment.invoiceUrl) {
            try {
                const patientData = await Patient_1.default.findById(appointment.patientId).lean();
                const doctorData = await User_1.default.findById(appointment.doctorId).lean();
                if (patientData && doctorData) {
                    const invoiceBuffer = await (0, invoice_service_1.generateInvoicePDF)(appointment, patientData, doctorData);
                    const fileName = `invoice-${appointment._id}-${Date.now()}.pdf`;
                    const invoiceUrl = await (0, supabase_service_1.uploadInvoicePDF)(invoiceBuffer, fileName);
                    appointment.invoiceUrl = invoiceUrl;
                }
            }
            catch (invoiceErr) {
                console.error('[Invoice Generation Error]', invoiceErr);
                // Don't fail the whole request if invoice fails
            }
        }
        const updatedAppointment = await appointment.save();
        // Notify Patient
        const patient = await Patient_1.default.findById(appointment.patientId).select('createdBy').lean();
        if (patient) {
            (0, socket_service_1.emitToUser)(patient.createdBy.toString(), 'appointment-updated', {
                appointment: updatedAppointment,
                message: `Your appointment status has been updated to ${status}`
            });
        }
        // Notify Doctor
        (0, socket_service_1.emitToUser)(appointment.doctorId.toString(), 'appointment-updated', {
            appointment: updatedAppointment,
            message: `Appointment status updated to ${status}`
        });
        res.json(updatedAppointment);
    }
    catch (error) {
        console.error('[Update Appointment Status Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
