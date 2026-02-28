import express from 'express';
import {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
} from '../controllers/patient.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('Admin', 'Receptionist', 'Doctor'), createPatient)
    .get(protect, getPatients);

router.route('/:id')
    .get(protect, getPatientById)
    .put(protect, authorizeRoles('Admin', 'Receptionist', 'Doctor'), updatePatient)
    .delete(protect, authorizeRoles('Admin'), deletePatient);

export default router;
