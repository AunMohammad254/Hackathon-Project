import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, getUserProfile } from '../controllers/auth.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

const MongoStore = require('rate-limit-mongo');

// Strict rate limiting for registration to prevent spam
const registerLimiter = rateLimit({
    store: new MongoStore({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic-saas',
        expireTimeMs: 60 * 60 * 1000,
        errorHandler: console.error.bind(console, 'rate-limit-mongo')
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: { success: false, message: 'Too many registrations from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

export default router;
