"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientPrescriptions = exports.createPrescription = void 0;
const Prescription_1 = __importDefault(require("../models/Prescription"));
const Patient_1 = __importDefault(require("../models/Patient"));
const pdf_service_1 = require("../services/pdf.service");
const supabase_service_1 = require("../services/supabase.service");
const crypto_1 = __importDefault(require("crypto"));
const createPrescription = async (req, res) => {
    try {
        const { patientId, medicines, instructions, aiInsights, riskLevel } = req.body;
        const doctorId = req.user._id;
        // 1. Fetch relations for PDF 
        const patient = await Patient_1.default.findById(patientId);
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
            riskLevel
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
            pdfUrl
        });
        res.status(201).json(prescription);
    }
    catch (error) {
        console.error('Prescription Creation Error:', error);
        res.status(500).json({ message: 'Server error generating prescription', error: error.message });
    }
};
exports.createPrescription = createPrescription;
const getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await Prescription_1.default.find({ patientId })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(prescriptions);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching prescriptions', error });
    }
};
exports.getPatientPrescriptions = getPatientPrescriptions;
