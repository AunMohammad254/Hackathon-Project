/**
 * Gemini API Queue — auto-retries rate-limited requests with countdown.
 * 
 * Instead of failing on 429s, requests are queued and retried automatically.
 * The frontend receives a retry-after time so it can show a countdown to the user.
 * 
 * Gemini Free Tier: 15 RPM, 1500 RPD
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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
interface QueueItem {
    prompt: string;
    resolve: (text: string) => void;
    reject: (err: Error) => void;
    retries: number;
}

const queue: QueueItem[] = [];
let isProcessing = false;
let lastRequestTime = 0;
let cooldownUntil = 0;     // timestamp when cooldown ends

const MIN_INTERVAL_MS = 4500;  // ~13 RPM — safely under 15 RPM limit
const MAX_RETRIES = 3;

/**
 * Returns the model instance.
 */
const getModel = (): GenerativeModel => {
    return getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
};

/**
 * Returns seconds remaining in cooldown (0 if none).
 */
export const getCooldownRemaining = (): number => {
    const remaining = Math.max(0, cooldownUntil - Date.now());
    return Math.ceil(remaining / 1000);
};

/**
 * Process the queue one item at a time with rate-limiting delays.
 */
const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    while (queue.length > 0) {
        const item = queue[0];

        // Wait for cooldown if active
        const now = Date.now();
        if (cooldownUntil > now) {
            const waitMs = cooldownUntil - now;
            console.log(`[GeminiQueue] Cooling down for ${Math.ceil(waitMs / 1000)}s...`);
            await sleep(waitMs);
        }

        // Enforce minimum interval between requests
        const elapsed = Date.now() - lastRequestTime;
        if (elapsed < MIN_INTERVAL_MS) {
            await sleep(MIN_INTERVAL_MS - elapsed);
        }

        try {
            lastRequestTime = Date.now();
            const model = getModel();
            const result = await model.generateContent(item.prompt);
            const text = result.response.text();

            queue.shift(); // remove from queue
            item.resolve(text);
        } catch (error: any) {
            const message = error?.message || '';
            const status = error?.status;

            // Rate limited — parse retry delay and set cooldown
            if (status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
                const retryMatch = message.match(/retry\s+in\s+([\d.]+)s/i);
                const retrySeconds = retryMatch ? parseFloat(retryMatch[1]) : 15;
                cooldownUntil = Date.now() + (retrySeconds * 1000) + 1000; // +1s buffer

                console.log(`[GeminiQueue] Rate limited. Retrying in ${retrySeconds + 1}s...`);

                if (item.retries < MAX_RETRIES) {
                    item.retries++;
                    // Don't remove from queue — retry on next loop iteration
                } else {
                    queue.shift();
                    item.reject(new Error(`Rate limited after ${MAX_RETRIES} retries. Please try again later.`));
                }
            } else {
                // Non-rate-limit error — fail immediately
                queue.shift();
                item.reject(error);
            }
        }
    }

    isProcessing = false;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main entry point: queue a prompt for Gemini and return the response text.
 * Automatically handles rate limiting with retries.
 */
export const queueGeminiRequest = (prompt: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        queue.push({ prompt, resolve, reject, retries: 0 });
        processQueue(); // kick off processing if not already running
    });
};

/**
 * Get current queue status for the frontend.
 */
export const getQueueStatus = () => ({
    queueLength: queue.length,
    cooldownRemaining: getCooldownRemaining(),
    isProcessing,
});
