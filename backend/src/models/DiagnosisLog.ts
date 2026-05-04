import mongoose from 'mongoose';

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

const DiagnosisLog = mongoose.models.DiagnosisLog || mongoose.model('DiagnosisLog', diagnosisLogSchema);
export default DiagnosisLog;
