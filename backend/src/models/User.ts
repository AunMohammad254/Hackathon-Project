import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['Admin', 'Doctor', 'Receptionist', 'Patient'],
        required: true,
    },
    subscriptionPlan: {
        type: String,
        enum: ['Free', 'Pro'],
        default: 'Free',
    },
}, { timestamps: true });

// PERF-04: Index for role-based queries
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
