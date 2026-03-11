import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

// Load env before anything else
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic-saas';

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const superAdminExists = await User.findOne({ role: 'Super Admin' });

        if (superAdminExists) {
            console.log('A Super Admin already exists in the database. Exiting.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('supersecret123', salt);

        await User.create({
            name: 'System Super Admin',
            email: 'superadmin@clinic.com',
            password: hashedPassword,
            role: 'Super Admin',
            status: 'Approved',
        });

        console.log('Super Admin successfully seeded!');
        console.log('Email: superadmin@clinic.com');
        console.log('Password: supersecret123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding Super Admin:', error);
        process.exit(1);
    }
};

seedSuperAdmin();
