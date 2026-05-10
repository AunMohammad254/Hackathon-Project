import mongoose, { Document } from 'mongoose';

export interface IDiagnosisLogDocument extends Document {
    patientId?: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    symptoms: string[];
    aiResponse: any;
    riskLevel: 'Low' | 'Medium' | 'High';
    age?: number;
    gender?: string;
    createdAt: Date;
    updatedAt: Date;
}

const diagnosisLogSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    symptoms: [{
        type: String,
    }],
    aiResponse: {
        type: mongoose.Schema.Types.Mixed,
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low',
    },
    age: { type: Number },
    gender: { type: String },
}, { timestamps: true });

// PERF-04: Index for doctor lookups
diagnosisLogSchema.index({ doctorId: 1 });

const DiagnosisLog = mongoose.models.DiagnosisLog || mongoose.model<IDiagnosisLogDocument>('DiagnosisLog', diagnosisLogSchema);
export default DiagnosisLog;
