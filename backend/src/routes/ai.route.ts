import express from 'express';
import { symptomChecker, explainPrescription, analyzeLabReport, translatePrescription, checkDrugInteractions, healthChat, predictiveAnalytics, upgradePlan, aiQueueStatus } from '../controllers/ai.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { requireProPlan } from '../middleware/subscriptionMiddleware';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

// Queue status (for frontend countdown)
router.get('/queue-status', protect, aiQueueStatus);

// All AI endpoints get rate limiting
// Doctor endpoints
router.post('/symptom-checker', protect, authorizeRoles('Doctor'), aiRateLimiter, symptomChecker);
router.post('/analyze-report', protect, authorizeRoles('Doctor'), aiRateLimiter, upload.single('report'), analyzeLabReport);
router.post('/check-interactions', protect, authorizeRoles('Doctor'), aiRateLimiter, checkDrugInteractions);

// Patient endpoints
router.post('/explain-prescription', protect, authorizeRoles('Patient'), aiRateLimiter, explainPrescription);
router.post('/translate-prescription', protect, authorizeRoles('Patient'), aiRateLimiter, translatePrescription);
router.post('/chat', protect, authorizeRoles('Patient'), aiRateLimiter, healthChat);

// SaaS-gated endpoints (Pro plan only)
router.post('/predictive-analytics', protect, authorizeRoles('Admin'), requireProPlan, aiRateLimiter, predictiveAnalytics);

// Plan management (no rate limit needed)
router.post('/upgrade-plan', protect, upgradePlan);

export default router;
