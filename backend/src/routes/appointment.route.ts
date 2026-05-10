import express from 'express';
import {
    createAppointment,
    getAppointments,
    getPatientAppointments,
    updateAppointmentStatus,
} from '../controllers/appointment.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router: express.Router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('Admin', 'Receptionist', 'Patient', 'Doctor'), createAppointment)
    .get(protect, getAppointments);

router.route('/patient/:patientId')
    .get(protect, getPatientAppointments);

router.route('/:id/status')
    .put(protect, authorizeRoles('Admin', 'Receptionist', 'Doctor'), updateAppointmentStatus);

export default router;
