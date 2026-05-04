import express from 'express';
import { getDoctors, updateProfile } from '../controllers/user.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/doctors', protect, getDoctors);
router.put('/profile', protect, updateProfile);

export default router;
