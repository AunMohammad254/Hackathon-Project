"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ai_controller_1 = require("../controllers/ai.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const subscriptionMiddleware_1 = require("../middleware/subscriptionMiddleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = express_1.default.Router();
// Queue status (for frontend countdown)
router.get('/queue-status', authMiddleware_1.protect, ai_controller_1.aiQueueStatus);
// All AI endpoints get rate limiting
// Doctor endpoints
router.post('/symptom-checker', authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Doctor'), rateLimiter_1.aiRateLimiter, ai_controller_1.symptomChecker);
router.post('/analyze-report', authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Doctor'), rateLimiter_1.aiRateLimiter, uploadMiddleware_1.upload.single('report'), ai_controller_1.analyzeLabReport);
router.post('/check-interactions', authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Doctor'), rateLimiter_1.aiRateLimiter, ai_controller_1.checkDrugInteractions);
// Patient endpoints
router.post('/explain-prescription', authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Patient'), rateLimiter_1.aiRateLimiter, ai_controller_1.explainPrescription);
router.post('/translate-prescription', authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Patient'), rateLimiter_1.aiRateLimiter, ai_controller_1.translatePrescription);
router.post('/chat', authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Patient'), rateLimiter_1.aiRateLimiter, ai_controller_1.healthChat);
// SaaS-gated endpoints (Pro plan only)
router.post('/predictive-analytics', authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin', 'Doctor'), subscriptionMiddleware_1.requireProPlan, rateLimiter_1.aiRateLimiter, ai_controller_1.predictiveAnalytics);
// Plan management (no rate limit needed)
router.post('/upgrade-plan', authMiddleware_1.protect, ai_controller_1.upgradePlan);
exports.default = router;
