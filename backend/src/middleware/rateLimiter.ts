import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

/**
 * In-memory rate limiter for Gemini AI endpoints.
 * 
 * Gemini Free Tier limits (as of 2024):
 *   - 15 requests per minute (RPM)
 *   - 1,500 requests per day (RPD)
 * 
 * This middleware enforces per-user limits to stay safely within the free tier.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;         // minute window reset timestamp
    dailyCount: number;
    dailyResetAt: number;    // daily reset timestamp
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration — conservative limits to stay within free tier
const MAX_REQUESTS_PER_MINUTE = 5;   // per user, per minute (global Gemini limit is 15)
const MAX_REQUESTS_PER_DAY = 100;    // per user, per day (global Gemini limit is 1500)
const WINDOW_MS = 60 * 1000;         // 1 minute
const DAY_MS = 24 * 60 * 60 * 1000;  // 24 hours

// Clean up stale entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (now > entry.dailyResetAt) {
            rateLimitStore.delete(key);
        }
    }
}, 10 * 60 * 1000);

export const aiRateLimiter = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id?.toString() || req.ip || 'anonymous';
    const now = Date.now();

    let entry = rateLimitStore.get(userId);

    if (!entry) {
        entry = {
            count: 0,
            resetAt: now + WINDOW_MS,
            dailyCount: 0,
            dailyResetAt: now + DAY_MS,
        };
        rateLimitStore.set(userId, entry);
    }

    // Reset minute window
    if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + WINDOW_MS;
    }

    // Reset daily window
    if (now > entry.dailyResetAt) {
        entry.dailyCount = 0;
        entry.dailyResetAt = now + DAY_MS;
    }

    // Check minute limit
    if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return res.status(429).json({
            success: false,
            message: `AI rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
            retryAfterSeconds: retryAfter,
        });
    }

    // Check daily limit
    if (entry.dailyCount >= MAX_REQUESTS_PER_DAY) {
        return res.status(429).json({
            success: false,
            message: 'Daily AI usage limit reached. Please try again tomorrow.',
            retryAfterSeconds: Math.ceil((entry.dailyResetAt - now) / 1000),
        });
    }

    // Increment counters
    entry.count++;
    entry.dailyCount++;

    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_MINUTE);
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS_PER_MINUTE - entry.count);
    res.setHeader('X-RateLimit-DailyRemaining', MAX_REQUESTS_PER_DAY - entry.dailyCount);

    next();
};
