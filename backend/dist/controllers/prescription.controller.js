"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPrescriptions = exports.getPatientPrescriptions = exports.createPrescription = void 0;
const zod_1 = require("zod");
const Prescription_1 = __importDefault(require("../models/Prescription"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const pdf_service_1 = require("../services/pdf.service");
const supabase_service_1 = require("../services/supabase.service");
const crypto_1 = __importDefault(require("crypto"));
const socket_service_1 = require("../services/socket.service");
const medicineSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Medicine name is required'),
    dosage: zod_1.z.string().min(1, 'Dosage is required'),
    duration: zod_1.z.string().min(1, 'Duration is required'),
});
const createPrescriptionSchema = zod_1.z.object({
    patientId: zod_1.z.string().min(1, 'Patient ID is required'),
    medicines: zod_1.z.array(medicineSchema).min(1, 'At least one medicine is required'),
    instructions: zod_1.z.string().optional().default(''),
    aiInsights: zod_1.z.string().optional().default(''),
    riskLevel: zod_1.z.string().optional().default('Low'),
});
const createPrescription = async (req, res) => {
    const parsed = createPrescriptionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors, });
    }
    const { patientId, medicines, instructions, aiInsights, riskLevel } = parsed.data;
    try {
        const doctorId = req.user._id;
        // 1. Fetch patient for PDF
        const patient = await Patient_1.default.findById(patientId).lean();
        if (!patient)
            return res.status(404).json({ success: false, message: 'Patient not found' });
        // 2. Generate PDF via internal service
        const pdfData = {
            patientName: patient.name,
            doctorName: req.user.name,
            date: new Date().toLocaleDateString(),
            medicines,
            instructions,
            aiInsights,
            riskLevel,
        };
        const pdfBuffer = await (0, pdf_service_1.generatePrescriptionPDF)(pdfData);
        // 3. Upload to Supabase Storage
        const fileName = `prescription-${patientId}-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}.pdf`;
        const pdfUrl = await (0, supabase_service_1.uploadPrescriptionPDF)(pdfBuffer, fileName);
        // 4. Save Record to MongoDB
        const prescription = await Prescription_1.default.create({
            patientId,
            doctorId,
            medicines,
            instructions,
            aiInsights,
            riskLevel,
            pdfUrl,
        });
        // 5. Map the filename to a secure signed URL for the immediate frontend response
        const signedUrl = await (0, supabase_service_1.getSignedPrescriptionUrl)(fileName);
        const responseData = prescription.toObject();
        responseData.pdfUrl = signedUrl || fileName;
        // Notify Patient
        if (patient.createdBy) {
            (0, socket_service_1.emitToUser)(patient.createdBy.toString(), 'prescription-issued', {
                prescription: responseData,
                message: 'A new prescription has been issued for you.'
            });
        }
        res.status(201).json({
            success: true,
            prescription: responseData
        });
    }
    catch (error) {
        console.error('[Create Prescription Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.createPrescription = createPrescription;
const getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;
        // SEC-03 FIX: Verify the requesting user has access to this patient's prescriptions
        if (req.user.role === 'Patient') {
            const patient = await Patient_1.default.findById(patientId).lean();
            if (!patient || patient.createdBy.toString() !== req.user._id) {
                return res.status(403).json({ success: false, message: 'Access denied: you can only view your own prescriptions' });
            }
        }
        else if (req.user.role === 'Doctor') {
            // Doctors can view all prescriptions for patients assigned to them via appointment
            const hasAccess = await Appointment_1.default.exists({ patientId, doctorId: req.user._id });
            if (!hasAccess) {
                return res.status(403).json({ success: false, message: 'Access denied: patient not assigned to you' });
            }
        }
        // Admin has full access
        const prescriptions = await Prescription_1.default.find({ patientId })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();
        const prescriptionsWithUrls = await Promise.all(prescriptions.map(async (p) => {
            if (p.pdfUrl && !p.pdfUrl.startsWith('http')) {
                p.pdfUrl = await (0, supabase_service_1.getSignedPrescriptionUrl)(p.pdfUrl) || p.pdfUrl;
            }
            return p;
        }));
        res.status(200).json(prescriptionsWithUrls);
    }
    catch (error) {
        console.error('[Get Prescriptions Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getPatientPrescriptions = getPatientPrescriptions;
// @desc    Get prescriptions for the logged-in patient
// @route   GET /api/prescriptions/my
// @access  Private (Patient)
const getMyPrescriptions = async (req, res) => {
    try {
        if (req.user.role !== 'Patient') {
            return res.status(403).json({ success: false, message: 'Only patients can access their own prescriptions' });
        }
        // Find all patient profiles created by this user
        const patientProfiles = await Patient_1.default.find({ createdBy: req.user._id }).select('_id').lean();
        const patientIds = patientProfiles.map(p => p._id);
        if (patientIds.length === 0) {
            return res.status(200).json([]);
        }
        const prescriptions = await Prescription_1.default.find({ patientId: { $in: patientIds } })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();
        const prescriptionsWithUrls = await Promise.all(prescriptions.map(async (p) => {
            if (p.pdfUrl && !p.pdfUrl.startsWith('http')) {
                p.pdfUrl = await (0, supabase_service_1.getSignedPrescriptionUrl)(p.pdfUrl) || p.pdfUrl;
            }
            return p;
        }));
        res.status(200).json(prescriptionsWithUrls);
    }
    catch (error) {
        console.error('[Get My Prescriptions Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getMyPrescriptions = getMyPrescriptions;
