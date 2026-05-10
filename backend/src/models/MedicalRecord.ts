import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalRecordDocument extends Document {
    patientId: mongoose.Types.ObjectId;
    fileName: string;
    fileType: string;
    fileKey: string;
    aiAnalysis: {
        patientName?: string;
        date?: string;
        findings: string[];
        nextSteps: string[];
        metrics?: Array<{
            name: string;
            value: string;
            unit: string;
            referenceRange: string;
            status: 'Normal' | 'Abnormal';
        }>;
        rawText: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const medicalRecordSchema = new Schema(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        fileKey: {
            type: String,
            required: true,
        },
        aiAnalysis: {
            patientName: { type: String },
            date: { type: String },
            findings: [{ type: String }],
            nextSteps: [{ type: String }],
            metrics: [
                {
                    name: { type: String },
                    value: { type: String },
                    unit: { type: String },
                    referenceRange: { type: String },
                    status: { type: String, enum: ['Normal', 'Abnormal'] },
                }
            ],
            rawText: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.MedicalRecord || mongoose.model<IMedicalRecordDocument>('MedicalRecord', medicalRecordSchema);
