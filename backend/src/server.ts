import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.route';
import patientRoutes from './routes/patient.route';
import appointmentRoutes from './routes/appointment.route';
import aiRoutes from './routes/ai.route';
import prescriptionRoutes from './routes/prescription.route';
import adminRoutes from './routes/admin.route';
import userRoutes from './routes/user.route';
import doctorRoutes from './routes/doctor.route';
import { requestLogger } from './middleware/requestLogger';
import { setupSwagger } from './docs/swagger';

// Load env before anything else (supports both src & dist builds)
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// Validate critical env vars on startup
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
    process.exit(1);
}

const app = express();

// Request Logger (INFRA-03)
app.use(requestLogger);

// Security Middleware
app.use(helmet());
const allowedOrigins = [
    'http://localhost:3000',
    'https://hackathon-project-orcin-eight.vercel.app',
];

if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

const MongoStore = require('rate-limit-mongo');

// Rate limiting on auth routes (prevent brute force)
const authLimiter = rateLimit({
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
app.get('/api/v1/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/doctor', doctorRoutes);
app.use('/api/v1/admin', adminRoutes);

// Setup Swagger UI (INFRA-02)
setupSwagger(app);

// Global Error Handler — must be last middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                await mongoose.connection.close();
                console.log('MongoDB connection closed.');
                process.exit(0);
            });
            // Force exit after 10s if graceful shutdown fails
            setTimeout(() => process.exit(1), 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        console.error('Failed to start server:', (error as Error).message);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export { app };
