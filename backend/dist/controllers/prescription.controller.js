"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientPrescriptions = exports.createPrescription = void 0;
const zod_1 = require("zod");
const Prescription_1 = __importDefault(require("../models/Prescription"));
const Patient_1 = __importDefault(require("../models/Patient"));
const pdf_service_1 = require("../services/pdf.service");
const supabase_service_1 = require("../services/supabase.service");
const crypto_1 = __importDefault(require("crypto"));
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
    riskLevel: zod_1.z.string().optional().default(''),
});
const createPrescription = async (req, res) => {
    const parsed = createPrescriptionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    const { patientId, medicines, instructions, aiInsights, riskLevel } = parsed.data;
    try {
        const doctorId = req.user._id;
        // 1. Fetch patient for PDF
        const patient = await Patient_1.default.findById(patientId).lean();
        if (!patient)
            return res.status(404).json({ message: 'Patient not found' });
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
        res.status(201).json(prescription);
    }
    catch (error) {
        console.error('[Create Prescription Error]', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createPrescription = createPrescription;
const getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await Prescription_1.default.find({ patientId })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json(prescriptions);
    }
    catch (error) {
        console.error('[Get Prescriptions Error]', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPatientPrescriptions = getPatientPrescriptions;
