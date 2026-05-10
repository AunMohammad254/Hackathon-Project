import mongoose, { Document } from 'mongoose';
import { IPatient } from '@ai-clinic/shared';

export interface IPatientDocument extends Omit<IPatient, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>, Document {
    createdBy: mongoose.Types.ObjectId;
}

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true,
    },
    contact: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

// PERF-04: Build index for user lookups
patientSchema.index({ createdBy: 1 });

const Patient = mongoose.models.Patient || mongoose.model<IPatientDocument>('Patient', patientSchema);
export default Patient;
