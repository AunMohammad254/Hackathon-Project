"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const appointmentSchema = new mongoose_1.default.Schema({
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
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending',
    },
}, { timestamps: true });
// PERF-04: Indexes for common query patterns
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ patientId: 1 });
const Appointment = mongoose_1.default.model('Appointment', appointmentSchema);
exports.default = Appointment;
