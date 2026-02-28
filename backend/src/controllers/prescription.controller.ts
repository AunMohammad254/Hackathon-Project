import { Request, Response } from 'express';
import Prescription from '../models/Prescription';
import Patient from '../models/Patient';
import User from '../models/User';
import { generatePrescriptionPDF } from '../services/pdf.service';
import { uploadPrescriptionPDF } from '../services/supabase.service';
import crypto from 'crypto';

interface AuthRequest extends Request {
    user?: any;
}

export const createPrescription = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId, medicines, instructions, aiInsights, riskLevel } = req.body;
        const doctorId = req.user._id;

        // 1. Fetch relations for PDF 
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

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
            pdfUrl
        });

        res.status(201).json(prescription);
    } catch (error: any) {
        console.error('Prescription Creation Error:', error);
        res.status(500).json({ message: 'Server error generating prescription', error: error.message });
    }
};

export const getPatientPrescriptions = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching prescriptions', error });
    }
};
