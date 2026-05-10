"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientRecordsForDoctor = exports.deleteRecord = exports.getMyRecords = exports.getMyDiagnoses = exports.deletePatient = exports.updatePatient = exports.getPatientById = exports.getPatients = exports.createPatientProfile = exports.createPatient = void 0;
const zod_1 = require("zod");
const Patient_1 = __importDefault(require("../models/Patient"));
const DiagnosisLog_1 = __importDefault(require("../models/DiagnosisLog"));
const MedicalRecord_1 = __importDefault(require("../models/MedicalRecord"));
const supabase_service_1 = require("../services/supabase.service");
const createPatientSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
    age: zod_1.z.coerce.number().min(0, 'Age must be 0 or greater').max(150),
    gender: zod_1.z.enum(['Male', 'Female', 'Other']),
    contact: zod_1.z.string().min(5, 'Contact must be at least 5 characters'),
});
const createPatientProfileSchema = zod_1.z.object({
    age: zod_1.z.coerce.number().min(0, 'Age must be 0 or greater').max(150),
    gender: zod_1.z.enum(['Male', 'Female', 'Other']),
    contact: zod_1.z.string().min(5, 'Contact must be at least 5 characters'),
});
const updatePatientSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    age: zod_1.z.coerce.number().min(0).max(150).optional(),
    gender: zod_1.z.enum(['Male', 'Female', 'Other']).optional(),
    contact: zod_1.z.string().min(5).optional(),
});
// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private (Admin, Receptionist, Doctor)
const createPatient = async (req, res) => {
    const parsed = createPatientSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors, });
    }
    const { name, age, gender, contact } = parsed.data;
    try {
        const patient = new Patient_1.default({
            name,
            age,
            gender,
            contact,
            createdBy: req.user._id,
        });
        const createdPatient = await patient.save();
        res.status(201).json({
            success: true,
            patient: createdPatient
        });
    }
    catch (error) {
        console.error('[Create Patient Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.createPatient = createPatient;
// @desc    Create patient profile for logged-in user
// @route   POST /api/patients/profile
// @access  Private (Patient)
const createPatientProfile = async (req, res) => {
    const parsed = createPatientProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors, });
    }
    try {
        const existingPatient = await Patient_1.default.findOne({ createdBy: req.user._id });
        if (existingPatient) {
            return res.status(400).json({ success: false, message: 'Patient profile already exists' });
        }
        const { age, gender, contact } = parsed.data;
        const patient = new Patient_1.default({
            name: req.user.name,
            age,
            gender,
            contact,
            createdBy: req.user._id,
        });
        const createdPatient = await patient.save();
        res.status(201).json({
            success: true,
            patient: createdPatient
        });
    }
    catch (error) {
        console.error('[Create Patient Profile Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.createPatientProfile = createPatientProfile;
// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const skip = (page - 1) * limit;
        let dbQuery = Patient_1.default.find({}).populate('createdBy', 'name email');
        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit);
        }
        const patients = await dbQuery.lean();
        res.json({
            success: true,
            patients
        });
    }
    catch (error) {
        console.error('[Get Patients Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getPatients = getPatients;
// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res) => {
    try {
        const patient = await Patient_1.default.findById(req.params.id)
            .populate('createdBy', 'name email')
            .lean();
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        // SEC-02 FIX: If the user is a Patient, they can only view their own record
        if (req.user.role === 'Patient' && patient.createdBy._id.toString() !== req.user._id) {
            return res.status(403).json({ success: false, message: 'Access denied: you can only view your own profile' });
        }
        res.json({
            success: true,
            patient
        });
    }
    catch (error) {
        console.error('[Get Patient Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getPatientById = getPatientById;
// @desc    Update a patient
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res) => {
    const parsed = updatePatientSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors, });
    }
    const { name, age, gender, contact } = parsed.data;
    try {
        const patient = await Patient_1.default.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        // BUG-06: Use nullish coalescing to handle falsy values (e.g., age=0)
        if (name !== undefined)
            patient.name = name;
        if (age !== undefined)
            patient.age = age;
        if (gender !== undefined)
            patient.gender = gender;
        if (contact !== undefined)
            patient.contact = contact;
        const updatedPatient = await patient.save();
        res.json({
            success: true,
            patient: updatedPatient
        });
    }
    catch (error) {
        console.error('[Update Patient Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updatePatient = updatePatient;
// @desc    Delete a patient
// @route   DELETE /api/patients/:id
// @access  Private
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient_1.default.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        await patient.deleteOne();
        res.json({ success: true, message: 'Patient removed' });
    }
    catch (error) {
        console.error('[Delete Patient Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.deletePatient = deletePatient;
// @desc    Get patient diagnoses
// @route   GET /api/patients/my-diagnoses
// @access  Private (Patient)
const getMyDiagnoses = async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({ createdBy: req.user._id });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        const diagnoses = await DiagnosisLog_1.default.find({ patientId: patient._id })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, data: diagnoses });
    }
    catch (error) {
        console.error('[Get Patient Diagnoses Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getMyDiagnoses = getMyDiagnoses;
// @desc    Get my medical records
// @route   GET /api/patients/my-records
// @access  Private (Patient)
const getMyRecords = async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({ createdBy: req.user._id });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        const records = await MedicalRecord_1.default.find({ patientId: patient._id })
            .sort({ createdAt: -1 })
            .lean();
        const recordsWithUrls = await Promise.all(records.map(async (record) => {
            const signedUrl = await (0, supabase_service_1.getSignedMedicalRecordUrl)(record.fileKey);
            return {
                ...record,
                fileUrl: signedUrl
            };
        }));
        res.json({ success: true, data: recordsWithUrls });
    }
    catch (error) {
        console.error('[Get Patient Records Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getMyRecords = getMyRecords;
// @desc    Delete a medical record
// @route   DELETE /api/patients/records/:id
// @access  Private (Patient)
const deleteRecord = async (req, res) => {
    try {
        const recordId = req.params.id;
        const patient = await Patient_1.default.findOne({ createdBy: req.user._id });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        const record = await MedicalRecord_1.default.findOne({ _id: recordId, patientId: patient._id });
        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found or access denied' });
        }
        await record.deleteOne();
        // Note: we could also delete the file from Supabase storage here using supabase.storage.from('medical-records').remove([record.fileKey])
        // For simplicity and to avoid destructive ops during hackathon, we only delete DB entry.
        res.json({ success: true, message: 'Medical record deleted' });
    }
    catch (error) {
        console.error('[Delete Patient Record Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.deleteRecord = deleteRecord;
// @desc    Get patient medical records (for Doctor/Admin)
// @route   GET /api/patients/:id/records
// @access  Private (Admin, Doctor)
const getPatientRecordsForDoctor = async (req, res) => {
    try {
        const patientId = req.params.id;
        const records = await MedicalRecord_1.default.find({ patientId })
            .sort({ createdAt: -1 })
            .lean();
        const recordsWithUrls = await Promise.all(records.map(async (record) => {
            const signedUrl = await (0, supabase_service_1.getSignedMedicalRecordUrl)(record.fileKey);
            return {
                ...record,
                fileUrl: signedUrl
            };
        }));
        res.json({ success: true, data: recordsWithUrls });
    }
    catch (error) {
        console.error('[Get Patient Records For Doctor Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getPatientRecordsForDoctor = getPatientRecordsForDoctor;
