import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, getUserProfile } from '../controllers/auth.controller';
import { protect } from '../middleware/authMiddleware';

const router: express.Router = express.Router();

// Strict rate limiting for registration to prevent spam
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: { success: false, message: 'Too many registrations from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', process.env.NODE_ENV === 'test' ? (req, res, next) => next() : registerLimiter, registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/me', protect, getUserProfile);

export default router;
