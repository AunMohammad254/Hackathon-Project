"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePatient = exports.updatePatient = exports.getPatientById = exports.getPatients = exports.createPatient = void 0;
const Patient_1 = __importDefault(require("../models/Patient"));
// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private (Admin, Receptionist, Doctor)
const createPatient = async (req, res) => {
    const { name, age, gender, contact } = req.body;
    try {
        const patient = new Patient_1.default({
            name,
            age,
            gender,
            contact,
            createdBy: req.user._id,
        });
        const createdPatient = await patient.save();
        res.status(201).json(createdPatient);
    }
    catch (error) {
        res.status(400).json({ message: 'Invalid patient data', error: error.message });
    }
};
exports.createPatient = createPatient;
// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
    try {
        const patients = await Patient_1.default.find({}).populate('createdBy', 'name email');
        res.json(patients);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getPatients = getPatients;
// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res) => {
    try {
        const patient = await Patient_1.default.findById(req.params.id).populate('createdBy', 'name email');
        if (patient) {
            res.json(patient);
        }
        else {
            res.status(404).json({ message: 'Patient not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getPatientById = getPatientById;
// @desc    Update a patient
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res) => {
    const { name, age, gender, contact } = req.body;
    try {
        const patient = await Patient_1.default.findById(req.params.id);
        if (patient) {
            patient.name = name || patient.name;
            patient.age = age || patient.age;
            patient.gender = gender || patient.gender;
            patient.contact = contact || patient.contact;
            const updatedPatient = await patient.save();
            res.json(updatedPatient);
        }
        else {
            res.status(404).json({ message: 'Patient not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.updatePatient = updatePatient;
// @desc    Delete a patient
// @route   DELETE /api/patients/:id
// @access  Private
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient_1.default.findById(req.params.id);
        if (patient) {
            await patient.deleteOne();
            res.json({ message: 'Patient removed' });
        }
        else {
            res.status(404).json({ message: 'Patient not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.deletePatient = deletePatient;
