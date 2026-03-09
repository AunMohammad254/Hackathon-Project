import jwt from 'jsonwebtoken';

export const generateToken = (id: string, role: string): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '1d', // SEC-06 FIX: Reduced from 7d to limit token abuse window
    });
};
