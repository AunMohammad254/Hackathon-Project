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

// PERF-04: Index for prescription lookups by patient
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
// PERF-04: Index for doctor lookups
prescriptionSchema.index({ doctorId: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
