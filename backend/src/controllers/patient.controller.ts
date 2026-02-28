import { Request, Response } from 'express';
import Patient from '../models/Patient';

// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private (Admin, Receptionist, Doctor)
export const createPatient = async (req: any, res: Response) => {
    const { name, age, gender, contact } = req.body;

    try {
        const patient = new Patient({
            name,
            age,
            gender,
            contact,
            createdBy: req.user._id,
        });

        const createdPatient = await patient.save();
        res.status(201).json(createdPatient);
    } catch (error: any) {
        res.status(400).json({ message: 'Invalid patient data', error: error.message });
    }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
export const getPatients = async (req: Request, res: Response) => {
    try {
        const patients = await Patient.find({}).populate('createdBy', 'name email');
        res.json(patients);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
export const getPatientById = async (req: Request, res: Response) => {
    try {
        const patient = await Patient.findById(req.params.id).populate('createdBy', 'name email');

        if (patient) {
            res.json(patient);
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a patient
// @route   PUT /api/patients/:id
// @access  Private
export const updatePatient = async (req: Request, res: Response) => {
    const { name, age, gender, contact } = req.body;

    try {
        const patient = await Patient.findById(req.params.id);

        if (patient) {
            patient.name = name || patient.name;
            patient.age = age || patient.age;
            patient.gender = gender || patient.gender;
            patient.contact = contact || patient.contact;

            const updatedPatient = await patient.save();
            res.json(updatedPatient);
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a patient
// @route   DELETE /api/patients/:id
// @access  Private
export const deletePatient = async (req: Request, res: Response) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (patient) {
            await patient.deleteOne();
            res.json({ message: 'Patient removed' });
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
