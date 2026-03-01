"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const patient_route_1 = __importDefault(require("./routes/patient.route"));
const appointment_route_1 = __importDefault(require("./routes/appointment.route"));
const ai_route_1 = __importDefault(require("./routes/ai.route"));
const prescription_route_1 = __importDefault(require("./routes/prescription.route"));
const admin_route_1 = __importDefault(require("./routes/admin.route"));
// Load env before anything else
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env'), override: true });
// Validate critical env vars on startup
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
    process.exit(1);
}
const app = (0, express_1.default)();
// Security Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10kb' }));
// Rate limiting on auth routes (prevent brute force)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window per IP
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
// Routes
app.use('/api/auth', auth_route_1.default);
app.use('/api/patients', patient_route_1.default);
app.use('/api/appointments', appointment_route_1.default);
app.use('/api/ai', ai_route_1.default);
app.use('/api/prescriptions', prescription_route_1.default);
app.use('/api/admin', admin_route_1.default);
// Global Error Handler — must be last middleware
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Error]', err.message);
    res.status(500).json({ message: 'Internal server error' });
});
// Database connection & server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic-saas';
const startServer = async () => {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                await mongoose_1.default.connection.close();
                console.log('MongoDB connection closed.');
                process.exit(0);
            });
            // Force exit after 10s if graceful shutdown fails
            setTimeout(() => process.exit(1), 10000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};
startServer();
