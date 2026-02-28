"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const diagnosisLogSchema = new mongoose_1.default.Schema({
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
    symptoms: [{
            type: String,
        }],
    aiResponse: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low',
    }
}, { timestamps: true });
const DiagnosisLog = mongoose_1.default.model('DiagnosisLog', diagnosisLogSchema);
exports.default = DiagnosisLog;
