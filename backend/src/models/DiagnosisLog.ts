import mongoose from 'mongoose';

const diagnosisLogSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
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
    }
}, { timestamps: true });

const DiagnosisLog = mongoose.model('DiagnosisLog', diagnosisLogSchema);
export default DiagnosisLog;
