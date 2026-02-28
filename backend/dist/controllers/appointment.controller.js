"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppointmentStatus = exports.getPatientAppointments = exports.getAppointments = exports.createAppointment = void 0;
const Appointment_1 = __importDefault(require("../models/Appointment"));
// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Admin, Receptionist, Patient)
const createAppointment = async (req, res) => {
    const { patientId, doctorId, date } = req.body;
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
        res.status(400).json({ message: 'Invalid appointment data', error: error.message });
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
            // A Patient user ID might not directly be the patientId in the Appointment schema
            // since patient models are created separately. But if we link them, we filter here.
            // Assuming for now Patients can only see appointments where they are the patient.
            // In our current schema, Patient is a separate model, and users have roles.
            // We'll need to find the Patient record associated with this User.
            // For simplicity in this demo, if the user is a patient, we pass patientId as query param or link it.
            if (req.query.patientId) {
                query = { patientId: req.query.patientId };
            }
        }
        const appointments = await Appointment_1.default.find(query)
            .populate('patientId', 'name age contact')
            .populate('doctorId', 'name email');
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
            .sort({ date: -1 }); // Sort by latest first for timeline
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getPatientAppointments = getPatientAppointments;
// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin, Receptionist, Doctor)
const updateAppointmentStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const appointment = await Appointment_1.default.findById(req.params.id);
        if (appointment) {
            appointment.status = status || appointment.status;
            const updatedAppointment = await appointment.save();
            res.json(updatedAppointment);
        }
        else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
