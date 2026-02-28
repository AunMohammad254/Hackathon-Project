import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import authRoutes from './routes/auth.route';
import patientRoutes from './routes/patient.route';
import appointmentRoutes from './routes/appointment.route';
import aiRoutes from './routes/ai.route';
import prescriptionRoutes from './routes/prescription.route';
import adminRoutes from './routes/admin.route';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic-saas';

// Start listening immediately — don't block on MongoDB connection
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection error:', error.message));
