import express from 'express';
import { getDoctorAnalytics, getDoctorPatients } from '../controllers/doctor.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router: express.Router = express.Router();

router.use(protect, authorizeRoles('Doctor'));

router.get('/analytics', getDoctorAnalytics);
router.get('/patients', getDoctorPatients);

export default router;
