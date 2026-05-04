import mongoose, { Document } from 'mongoose';
import { IAppointment, AppointmentStatus } from '@ai-clinic/shared';

export interface IAppointmentDocument extends Omit<IAppointment, '_id' | 'createdAt' | 'updatedAt' | 'patientId' | 'doctorId' | 'date'>, Document {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    date: Date;
}

const appointmentSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending',
    },
    reason: {
        type: String,
    },
    invoiceUrl: {
        type: String,
    },
}, { timestamps: true });

// PERF-04: Indexes for common query patterns
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ patientId: 1 });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
export default Appointment;
