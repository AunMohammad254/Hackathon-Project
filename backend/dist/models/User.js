"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
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
        enum: ['Admin', 'Super Admin', 'Doctor', 'Receptionist', 'Patient'],
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Approved',
    },
    subscriptionPlan: {
        type: String,
        enum: ['Free', 'Pro'],
        default: 'Free',
    },
    aiPredictiveGenCount: {
        type: Number,
        default: 0,
    },
    aiPredictiveGenResetDate: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
// PERF-04: Index for role-based queries
userSchema.index({ role: 1 });
const User = mongoose_1.default.models.User || mongoose_1.default.model('User', userSchema);
exports.default = User;
