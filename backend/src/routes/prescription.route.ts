import express from 'express';
import { createPrescription, getPatientPrescriptions } from '../controllers/prescription.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = express.Router();

// Only Doctor can create prescription
router.post('/', protect, authorizeRoles('Doctor'), createPrescription);

// Doctor, Patient, and Admin can view a patient's prescriptions
router.get('/patient/:patientId', protect, authorizeRoles('Doctor', 'Admin', 'Patient'), getPatientPrescriptions);

export default router;
