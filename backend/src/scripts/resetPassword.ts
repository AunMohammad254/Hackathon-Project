import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        await User.updateOne({ email: 'aunmohammad542@gmail.com' }, { password: hashedPassword });
        console.log("Password reset for aunmohammad542@gmail.com to 'password123'");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
