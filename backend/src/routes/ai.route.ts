import express from 'express';
import { analyzeSymptoms, analyzeLabReport } from '../controllers/ai.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.post('/diagnose', protect, authorizeRoles('Doctor'), analyzeSymptoms);
// NEW: Multimodal lab report analysis
router.post('/analyze-report', protect, authorizeRoles('Doctor'), upload.single('report'), analyzeLabReport);

export default router;
