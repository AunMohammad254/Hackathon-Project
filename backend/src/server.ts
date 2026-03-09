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

// Load env before anything else (supports both src & dist builds)
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// Validate critical env vars on startup
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
    process.exit(1);
}

const app = express();

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
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler — must be last middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Unhandled Error]', err.message);
    res.status(500).json({ message: 'Internal server error' });
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

startServer();
