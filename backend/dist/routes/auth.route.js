"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("../controllers/auth.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Strict rate limiting for registration to prevent spam
const registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: { success: false, message: 'Too many registrations from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/register', process.env.NODE_ENV === 'test' ? (req, res, next) => next() : registerLimiter, auth_controller_1.registerUser);
router.post('/login', auth_controller_1.loginUser);
router.get('/profile', authMiddleware_1.protect, auth_controller_1.getUserProfile);
router.get('/me', authMiddleware_1.protect, auth_controller_1.getUserProfile);
exports.default = router;
