/**
 * Gemini API Queue — auto-retries rate-limited requests with countdown.
 * Persistent MongoDB-backed Job Queue.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import GeminiJob from '../models/GeminiJob';

let genAI: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI => {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

// ── Queue state ──
const activeRequests = new Map<string, { resolve: (val: string) => void, reject: (err: Error) => void }>();
let isProcessing = false;
let cooldownUntil = 0;     // timestamp when cooldown ends

const MIN_INTERVAL_MS = 4500;  // ~13 RPM — safely under 15 RPM limit
const MAX_RETRIES = 3;

const getModel = (): GenerativeModel => {
    return getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
};

export const getCooldownRemaining = (): number => {
    const remaining = Math.max(0, cooldownUntil - Date.now());
    return Math.ceil(remaining / 1000);
};

const processQueue = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        while (true) {
            const job = await GeminiJob.findOne({ status: 'pending' }).sort({ createdAt: 1 });
            if (!job) break;

            const now = Date.now();
            if (cooldownUntil > now) {
                const waitMs = cooldownUntil - now;
                console.log(`[GeminiQueue] Cooling down for ${Math.ceil(waitMs / 1000)}s...`);
                await sleep(waitMs);
            }

            try {
                job.status = 'processing';
                job.lastAttemptedAt = new Date();
                await job.save();

                const model = getModel();
                const result = await model.generateContent(job.prompt as string);
                const text = result.response.text();

                job.status = 'completed';
                job.response = text;
                await job.save();

                const req = activeRequests.get(job._id.toString());
                if (req) {
                    req.resolve(text);
                    activeRequests.delete(job._id.toString());
                }
            } catch (error: unknown) {
                const message = (error instanceof Error) ? error.message : '';
                const status = (error as Record<string, unknown>)?.status;

                if (status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
                    const retryMatch = message.match(/retry\s+in\s+([\d.]+)s/i);
                    const retrySeconds = retryMatch ? parseFloat(retryMatch[1]) : 15;
                    cooldownUntil = Date.now() + (retrySeconds * 1000) + 1000; // +1s buffer

                    console.log(`[GeminiQueue] Rate limited. Retrying in ${retrySeconds + 1}s...`);

                    if (job.retries < MAX_RETRIES) {
                        job.retries += 1;
                        job.status = 'pending';
                        await job.save();
                    } else {
                        job.status = 'failed';
                        job.error = `Rate limited after ${MAX_RETRIES} retries.`;
                        await job.save();

                        const req = activeRequests.get(job._id.toString());
                        if (req) {
                            req.reject(new Error(job.error || 'Force failed after retries'));
                            activeRequests.delete(job._id.toString());
                        }
                    }
                } else {
                    job.status = 'failed';
                    job.error = message || 'Unknown processing error';
                    await job.save();

                    const req = activeRequests.get(job._id.toString());
                    if (req) {
                        req.reject(new Error(job.error || 'Unknown processing error'));
                        activeRequests.delete(job._id.toString());
                    }
                }
            }
            await sleep(MIN_INTERVAL_MS);
        }
    } finally {
        isProcessing = false;
    }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const queueGeminiRequest = async (prompt: string): Promise<string> => {
    const job = await GeminiJob.create({ prompt });

    return new Promise((resolve, reject) => {
        activeRequests.set(job._id.toString(), { resolve, reject });
        processQueue(); // kick off processing if not already running
    });
};

export const getQueueStatus = async () => {
    const queueLength = await GeminiJob.countDocuments({ status: { $in: ['pending', 'processing'] } });
    return {
        queueLength,
        cooldownRemaining: getCooldownRemaining(),
        isProcessing,
    };
};
