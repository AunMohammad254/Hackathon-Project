"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppointmentStatus = exports.getPatientAppointments = exports.getAppointments = exports.createAppointment = void 0;
const zod_1 = require("zod");
const Appointment_1 = __importDefault(require("../models/Appointment"));
const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const createAppointmentSchema = zod_1.z.object({
    patientId: zod_1.z.string().min(1, 'Patient ID is required'),
    doctorId: zod_1.z.string().min(1, 'Doctor ID is required'),
    date: zod_1.z.string().min(1, 'Date is required'),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(VALID_STATUSES),
});
// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Admin, Receptionist, Patient)
const createAppointment = async (req, res) => {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    const { patientId, doctorId, date } = parsed.data;
    try {
        const appointment = new Appointment_1.default({
            patientId,
            doctorId,
            date,
            status: 'pending',
        });
        const createdAppointment = await appointment.save();
        res.status(201).json(createdAppointment);
    }
    catch (error) {
        console.error('[Create Appointment Error]', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createAppointment = createAppointment;
// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        let query = {};
        // Filter based on role
        if (req.user.role === 'Doctor') {
            query = { doctorId: req.user._id };
        }
        else if (req.user.role === 'Patient') {
            // BUG-05: If a patientId is provided, filter by it;
            // otherwise return empty (don't expose all appointments)
            if (req.query.patientId) {
                query = { patientId: req.query.patientId };
            }
            else {
                return res.json([]);
            }
        }
        // Admin/Receptionist see all
        const appointments = await Appointment_1.default.find(query)
            .populate('patientId', 'name age contact')
            .populate('doctorId', 'name email')
            .lean();
        res.json(appointments);
    }
    catch (error) {
        console.error('[Get Appointments Error]', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAppointments = getAppointments;
// @desc    Get individual patient's appointments (Medical History Timeline)
// @route   GET /api/appointments/patient/:patientId
// @access  Private
const getPatientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment_1.default.find({ patientId: req.params.patientId })
            .populate('doctorId', 'name')
            .sort({ date: -1 })
            .lean();
        res.json(appointments);
    }
    catch (error) {
        console.error('[Get Patient Appointments Error]', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPatientAppointments = getPatientAppointments;
// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin, Receptionist, Doctor)
const updateAppointmentStatus = async (req, res) => {
    // BUG-02: Validate status enum before database call
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
    }
    const { status } = parsed.data;
    try {
        const appointment = await Appointment_1.default.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        appointment.status = status;
        const updatedAppointment = await appointment.save();
        res.json(updatedAppointment);
    }
    catch (error) {
        console.error('[Update Appointment Status Error]', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
