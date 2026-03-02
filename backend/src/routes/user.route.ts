import express from 'express';
import { getDoctors } from '../controllers/user.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/doctors', protect, getDoctors);

export default router;
