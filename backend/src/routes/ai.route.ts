import express from 'express';
import { analyzeSymptoms } from '../controllers/ai.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = express.Router();

router.post('/diagnose', protect, authorizeRoles('Doctor'), analyzeSymptoms);

export default router;
