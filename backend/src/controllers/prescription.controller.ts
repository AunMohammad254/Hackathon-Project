import { Response } from 'express';
import { z } from 'zod';
import Prescription from '../models/Prescription';
import Patient from '../models/Patient';
import { generatePrescriptionPDF } from '../services/pdf.service';
import { uploadPrescriptionPDF } from '../services/supabase.service';
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
        return res.status(400).json({
            message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { patientId, medicines, instructions, aiInsights, riskLevel } = parsed.data;

    try {
        const doctorId = req.user!._id;

        // 1. Fetch patient for PDF
        const patient = await Patient.findById(patientId).lean();
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

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

        res.status(201).json(prescription);
    } catch (error) {
        console.error('[Create Prescription Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getPatientPrescriptions = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(prescriptions);
    } catch (error) {
        console.error('[Get Prescriptions Error]', (error as Error).message);
        res.status(500).json({ message: 'Server error' });
    }
};
