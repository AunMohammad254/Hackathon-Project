import express from 'express';
import {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    createPatientProfile,
    getMyDiagnoses,
    getMyRecords,
    deleteRecord,
    getPatientRecordsForDoctor
} from '../controllers/patient.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router: express.Router = express.Router();

router.route('/profile')
    .post(protect, authorizeRoles('Patient'), createPatientProfile);

router.route('/')
    .post(protect, authorizeRoles('Admin', 'Receptionist', 'Doctor'), createPatient)
    .get(protect, authorizeRoles('Admin', 'Receptionist', 'Doctor'), getPatients);

router.route('/my-diagnoses')
    .get(protect, authorizeRoles('Patient'), getMyDiagnoses);

router.route('/my-records')
    .get(protect, authorizeRoles('Patient'), getMyRecords);

router.route('/records/:id')
    .delete(protect, authorizeRoles('Patient'), deleteRecord);

router.route('/:id/records')
    .get(protect, authorizeRoles('Admin', 'Doctor'), getPatientRecordsForDoctor);

router.route('/:id')
    .get(protect, authorizeRoles('Admin', 'Receptionist', 'Doctor', 'Patient'), getPatientById)
    .put(protect, authorizeRoles('Admin', 'Receptionist', 'Doctor'), updatePatient)
    .delete(protect, authorizeRoles('Admin'), deletePatient);

export default router;
