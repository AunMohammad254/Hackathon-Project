import { Response } from 'express';
import { z } from 'zod';
import Patient from '../models/Patient';
import DiagnosisLog from '../models/DiagnosisLog';
import MedicalRecord from '../models/MedicalRecord';
import { AuthRequest } from '../middleware/authMiddleware';
import { getSignedMedicalRecordUrl } from '../services/supabase.service';

const createPatientSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    age: z.coerce.number().min(0, 'Age must be 0 or greater').max(150),
    gender: z.enum(['Male', 'Female', 'Other']),
    contact: z.string().min(5, 'Contact must be at least 5 characters'),
});

const createPatientProfileSchema = z.object({
    age: z.coerce.number().min(0, 'Age must be 0 or greater').max(150),
    gender: z.enum(['Male', 'Female', 'Other']),
    contact: z.string().min(5, 'Contact must be at least 5 characters'),
});

const updatePatientSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    age: z.coerce.number().min(0).max(150).optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    contact: z.string().min(5).optional(),
});

// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private (Admin, Receptionist, Doctor)
export const createPatient = async (req: AuthRequest, res: Response) => {
    const parsed = createPatientSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors, });
    }

    const { name, age, gender, contact } = parsed.data;

    try {
        const patient = new Patient({
            name,
            age,
            gender,
            contact,
            createdBy: req.user!._id,
        });

        const createdPatient = await patient.save();
        res.status(201).json({
            success: true,
            patient: createdPatient
        });
    } catch (error: unknown) {
        console.error('[Create Patient Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create patient profile for logged-in user
// @route   POST /api/patients/profile
// @access  Private (Patient)
export const createPatientProfile = async (req: AuthRequest, res: Response) => {
    const parsed = createPatientProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors, });
    }

    try {
        const existingPatient = await Patient.findOne({ createdBy: req.user!._id });
        if (existingPatient) {
            return res.status(400).json({ success: false, message: 'Patient profile already exists' });
        }

        const { age, gender, contact } = parsed.data;

        const patient = new Patient({
            name: req.user!.name,
            age,
            gender,
            contact,
            createdBy: req.user!._id,
        });

        const createdPatient = await patient.save();
        res.status(201).json({
            success: true,
            patient: createdPatient
        });
    } catch (error: unknown) {
        console.error('[Create Patient Profile Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
export const getPatients = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 0;
        const skip = (page - 1) * limit;

        let dbQuery = Patient.find({}).populate('createdBy', 'name email');
        if (limit > 0) {
            dbQuery = dbQuery.skip(skip).limit(limit);
        }

        const patients = await dbQuery.lean();
        res.json({
            success: true,
            patients
        });
    } catch (error: unknown) {
        console.error('[Get Patients Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
export const getPatientById = async (req: AuthRequest, res: Response) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('createdBy', 'name email')
            .lean();

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // SEC-02 FIX: If the user is a Patient, they can only view their own record
        if (req.user!.role === 'Patient' && patient.createdBy._id.toString() !== req.user!._id) {
            return res.status(403).json({ success: false, message: 'Access denied: you can only view your own profile' });
        }

        res.json({
            success: true,
            patient
        });
    } catch (error: unknown) {
        console.error('[Get Patient Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a patient
// @route   PUT /api/patients/:id
// @access  Private
export const updatePatient = async (req: AuthRequest, res: Response) => {
    const parsed = updatePatientSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors, });
    }

    const { name, age, gender, contact } = parsed.data;

    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // BUG-06: Use nullish coalescing to handle falsy values (e.g., age=0)
        if (name !== undefined) patient.name = name;
        if (age !== undefined) patient.age = age;
        if (gender !== undefined) patient.gender = gender;
        if (contact !== undefined) patient.contact = contact;

        const updatedPatient = await patient.save();
        res.json({
            success: true,
            patient: updatedPatient
        });
    } catch (error: unknown) {
        console.error('[Update Patient Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete a patient
// @route   DELETE /api/patients/:id
// @access  Private
export const deletePatient = async (req: AuthRequest, res: Response) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        await patient.deleteOne();
        res.json({ success: true, message: 'Patient removed' });
    } catch (error: unknown) {
        console.error('[Delete Patient Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get patient diagnoses
// @route   GET /api/patients/my-diagnoses
// @access  Private (Patient)
export const getMyDiagnoses = async (req: AuthRequest, res: Response) => {
    try {
        const patient = await Patient.findOne({ createdBy: req.user!._id });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        
        const diagnoses = await DiagnosisLog.find({ patientId: patient._id })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();
            
        res.json({ success: true, data: diagnoses });
    } catch (error: unknown) {
        console.error('[Get Patient Diagnoses Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get my medical records
// @route   GET /api/patients/my-records
// @access  Private (Patient)
export const getMyRecords = async (req: AuthRequest, res: Response) => {
    try {
        const patient = await Patient.findOne({ createdBy: req.user!._id });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        
        const records = await MedicalRecord.find({ patientId: patient._id })
            .sort({ createdAt: -1 })
            .lean();
            
        const recordsWithUrls = await Promise.all(records.map(async (record) => {
            const signedUrl = await getSignedMedicalRecordUrl(record.fileKey);
            return {
                ...record,
                fileUrl: signedUrl
            };
        }));
            
        res.json({ success: true, data: recordsWithUrls });
    } catch (error: unknown) {
        console.error('[Get Patient Records Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete a medical record
// @route   DELETE /api/patients/records/:id
// @access  Private (Patient)
export const deleteRecord = async (req: AuthRequest, res: Response) => {
    try {
        const recordId = req.params.id;
        const patient = await Patient.findOne({ createdBy: req.user!._id });
        
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        
        const record = await MedicalRecord.findOne({ _id: recordId, patientId: patient._id });
        
        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found or access denied' });
        }
        
        await record.deleteOne();
        
        // Note: we could also delete the file from Supabase storage here using supabase.storage.from('medical-records').remove([record.fileKey])
        // For simplicity and to avoid destructive ops during hackathon, we only delete DB entry.
        
        res.json({ success: true, message: 'Medical record deleted' });
    } catch (error: unknown) {
        console.error('[Delete Patient Record Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get patient medical records (for Doctor/Admin)
// @route   GET /api/patients/:id/records
// @access  Private (Admin, Doctor)
export const getPatientRecordsForDoctor = async (req: AuthRequest, res: Response) => {
    try {
        const patientId = req.params.id;
        
        const records = await MedicalRecord.find({ patientId })
            .sort({ createdAt: -1 })
            .lean();
            
        const recordsWithUrls = await Promise.all(records.map(async (record) => {
            const signedUrl = await getSignedMedicalRecordUrl(record.fileKey);
            return {
                ...record,
                fileUrl: signedUrl
            };
        }));
            
        res.json({ success: true, data: recordsWithUrls });
    } catch (error: unknown) {
        console.error('[Get Patient Records For Doctor Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

