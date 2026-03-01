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

const DiagnosisLog = mongoose.model('DiagnosisLog', diagnosisLogSchema);
export default DiagnosisLog;
