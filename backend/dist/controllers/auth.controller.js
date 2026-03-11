"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const generateToken_1 = require("../utils/generateToken");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['Patient', 'Doctor', 'Receptionist', 'Admin']).optional().default('Patient'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    const { name, email, password, role } = parsed.data;
    try {
        const userExists = await User_1.default.findOne({ email }).lean();
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const isStaff = role !== 'Patient';
        const initialStatus = isStaff ? 'Pending' : 'Approved';
        const user = await User_1.default.create({
            name,
            email,
            password: hashedPassword,
            role: role,
            status: initialStatus,
        });
        // Auto-create a Patient profile only if the user is a Patient
        if (role === 'Patient') {
            await Patient_1.default.create({
                name,
                age: 0,
                gender: 'Other',
                contact: email, // Default contact to email
                createdBy: user._id
            });
        }
        if (initialStatus === 'Pending') {
            return res.status(201).json({
                success: true,
                message: 'Registration successful. Your account is pending admin approval.',
                isPending: true
            });
        }
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: (0, generateToken_1.generateToken)(user._id.toString(), user.role),
        });
    }
    catch (error) {
        console.error('[Register Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.registerUser = registerUser;
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    const { email, password } = parsed.data;
    try {
        // Find the user, typing the returned document to include status from the schema update
        const user = await User_1.default.findOne({ email });
        if (user && (await bcryptjs_1.default.compare(password, user.password))) {
            const status = user.status || 'Approved';
            if (status === 'Pending') {
                return res.status(403).json({ success: false, message: 'Account pending approval' });
            }
            if (status === 'Rejected') {
                return res.status(403).json({ success: false, message: 'Account registration rejected' });
            }
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: (0, generateToken_1.generateToken)(user._id.toString(), user.role),
            });
        }
        else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    }
    catch (error) {
        console.error('[Login Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.loginUser = loginUser;
// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id).select('-password').lean();
        if (user) {
            res.json(user);
        }
        else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    }
    catch (error) {
        console.error('[Profile Error]', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getUserProfile = getUserProfile;
