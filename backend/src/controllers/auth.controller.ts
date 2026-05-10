import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User';
import Patient from '../models/Patient';
import { generateToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/authMiddleware';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['Patient', 'Doctor', 'Receptionist', 'Admin']).optional().default('Patient'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: AuthRequest, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false, message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { name, email, password, role } = parsed.data;

    try {
        const userExists = await User.findOne({ email }).lean();

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const isStaff = role !== 'Patient';
        const isTest = process.env.NODE_ENV === 'test';
        const initialStatus = (isStaff && !isTest) ? 'Pending' : 'Approved';

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role,
            status: initialStatus,
        });

        // Auto-create a Patient profile only if the user is a Patient
        if (role === 'Patient') {
            await Patient.create({
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

        const token = generateToken(user._id.toString(), user.role);

        res.status(201).json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error: unknown) {
        console.error('[Register Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: AuthRequest, res: Response) => {
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
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const status = user.status || 'Approved';

            if (status === 'Pending') {
                return res.status(403).json({ success: false, message: 'Account pending approval' });
            }
            if (status === 'Rejected') {
                return res.status(403).json({ success: false, message: 'Account registration rejected' });
            }

            const token = generateToken(user._id.toString(), user.role);

            res.json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error: unknown) {
        console.error('[Login Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user!._id).select('-password').lean();
        if (user) {
            res.json({
                success: true,
                user: user,
                ...user
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error: unknown) {
        console.error('[Profile Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
