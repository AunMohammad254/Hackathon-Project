import express from 'express';
import { getDoctorAnalytics } from '../controllers/doctor.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = express.Router();

router.use(protect, authorizeRoles('Doctor'));

router.get('/analytics', getDoctorAnalytics);

export default router;
