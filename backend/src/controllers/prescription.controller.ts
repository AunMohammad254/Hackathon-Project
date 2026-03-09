import { Response } from 'express';
import { z } from 'zod';
import Prescription from '../models/Prescription';
import Patient from '../models/Patient';
import { generatePrescriptionPDF } from '../services/pdf.service';
import { uploadPrescriptionPDF, getSignedPrescriptionUrl } from '../services/supabase.service';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware';

const medicineSchema = z.object({
    name: z.string().min(1, 'Medicine name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    duration: z.string().min(1, 'Duration is required'),
});

const createPrescriptionSchema = z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    medicines: z.array(medicineSchema).min(1, 'At least one medicine is required'),
    instructions: z.string().optional().default(''),
    aiInsights: z.string().optional().default(''),
    riskLevel: z.string().optional().default(''),
});

export const createPrescription = async (req: AuthRequest, res: Response) => {
    const parsed = createPrescriptionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors, });
    }

    const { patientId, medicines, instructions, aiInsights, riskLevel } = parsed.data;

    try {
        const doctorId = req.user!._id;

        // 1. Fetch patient for PDF
        const patient = await Patient.findById(patientId).lean();
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        // 2. Generate PDF via internal service
        const pdfData = {
            patientName: patient.name,
            doctorName: req.user!.name,
            date: new Date().toLocaleDateString(),
            medicines,
            instructions,
            aiInsights,
            riskLevel,
        };

        const pdfBuffer = await generatePrescriptionPDF(pdfData);

        // 3. Upload to Supabase Storage
        const fileName = `prescription-${patientId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.pdf`;
        const pdfUrl = await uploadPrescriptionPDF(pdfBuffer, fileName);

        // 4. Save Record to MongoDB
        const prescription = await Prescription.create({
            patientId,
            doctorId,
            medicines,
            instructions,
            aiInsights,
            riskLevel,
            pdfUrl,
        });

        // 5. Map the filename to a secure signed URL for the immediate frontend response
        const signedUrl = await getSignedPrescriptionUrl(fileName);
        const responseData = prescription.toObject();
        responseData.pdfUrl = signedUrl || fileName;

        res.status(201).json(responseData);
    } catch (error: unknown) {
        console.error('[Create Prescription Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getPatientPrescriptions = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;

        // SEC-03 FIX: Verify the requesting user has access to this patient's prescriptions
        if (req.user!.role === 'Patient') {
            const patient = await Patient.findById(patientId).lean();
            if (!patient || patient.createdBy.toString() !== req.user!._id) {
                return res.status(403).json({ success: false, message: 'Access denied: you can only view your own prescriptions' });
            }
        } else if (req.user!.role === 'Doctor') {
            // Doctors can only see prescriptions they authored for this patient
            const hasPrescriptions = await Prescription.exists({ patientId, doctorId: req.user!._id });
            if (!hasPrescriptions) {
                return res.status(403).json({ success: false, message: 'Access denied: no prescriptions authored by you for this patient' });
            }
        }
        // Admin has full access

        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const prescriptionsWithUrls = await Promise.all(prescriptions.map(async (p: any) => {
            if (p.pdfUrl && !p.pdfUrl.startsWith('http')) {
                p.pdfUrl = await getSignedPrescriptionUrl(p.pdfUrl) || p.pdfUrl;
            }
            return p;
        }));

        res.status(200).json(prescriptionsWithUrls);
    } catch (error: unknown) {
        console.error('[Get Prescriptions Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get prescriptions for the logged-in patient
// @route   GET /api/prescriptions/my
// @access  Private (Patient)
export const getMyPrescriptions = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user!.role !== 'Patient') {
            return res.status(403).json({ success: false, message: 'Only patients can access their own prescriptions' });
        }

        // Find all patient profiles created by this user
        const patientProfiles = await Patient.find({ createdBy: req.user!._id }).select('_id').lean();
        const patientIds = patientProfiles.map(p => p._id);

        if (patientIds.length === 0) {
            return res.status(200).json([]);
        }

        const prescriptions = await Prescription.find({ patientId: { $in: patientIds } })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const prescriptionsWithUrls = await Promise.all(prescriptions.map(async (p: any) => {
            if (p.pdfUrl && !p.pdfUrl.startsWith('http')) {
                p.pdfUrl = await getSignedPrescriptionUrl(p.pdfUrl) || p.pdfUrl;
            }
            return p;
        }));

        res.status(200).json(prescriptionsWithUrls);
    } catch (error: unknown) {
        console.error('[Get My Prescriptions Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
