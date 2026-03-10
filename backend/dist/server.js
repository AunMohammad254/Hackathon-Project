"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
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
const user_route_1 = __importDefault(require("./routes/user.route"));
const doctor_route_1 = __importDefault(require("./routes/doctor.route"));
const requestLogger_1 = require("./middleware/requestLogger");
const swagger_1 = require("./docs/swagger");
// Load env before anything else (supports both src & dist builds)
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env'), override: true });
// Validate critical env vars on startup
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
    process.exit(1);
}
const app = (0, express_1.default)();
exports.app = app;
// Request Logger (INFRA-03)
app.use(requestLogger_1.requestLogger);
// Security Middleware
app.use((0, helmet_1.default)());
const allowedOrigins = [
    'http://localhost:3000',
    'https://hackathon-project-orcin-eight.vercel.app',
];
if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10kb' }));
const MongoStore = require('rate-limit-mongo');
// Rate limiting on auth routes (prevent brute force)
const authLimiter = (0, express_rate_limit_1.default)({
    store: new MongoStore({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic-saas',
        expireTimeMs: 15 * 60 * 1000,
        errorHandler: console.error.bind(console, 'rate-limit-mongo')
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window per IP
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/v1/auth', authLimiter);
// Health Check Endpoint (INFRA-04)
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
// Routes
app.use('/api/v1/auth', auth_route_1.default);
app.use('/api/v1/users', user_route_1.default);
app.use('/api/v1/patients', patient_route_1.default);
app.use('/api/v1/appointments', appointment_route_1.default);
app.use('/api/v1/ai', ai_route_1.default);
app.use('/api/v1/prescriptions', prescription_route_1.default);
app.use('/api/v1/doctor', doctor_route_1.default);
app.use('/api/v1/admin', admin_route_1.default);
// Setup Swagger UI (INFRA-02)
(0, swagger_1.setupSwagger)(app);
// Global Error Handler — must be last middleware
app.use((err, _req, res, _next) => {
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
    console.error('[Unhandled Error]', err.message || err);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
