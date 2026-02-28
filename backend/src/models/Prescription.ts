import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
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
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String }
    }],
    instructions: {
        type: String,
    },
    aiInsights: { type: String },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
    pdfUrl: { type: String },
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
