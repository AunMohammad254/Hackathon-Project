"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const prescriptionSchema = new mongoose_1.default.Schema({
    patientId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    doctorId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const Prescription = mongoose_1.default.model('Prescription', prescriptionSchema);
exports.default = Prescription;
