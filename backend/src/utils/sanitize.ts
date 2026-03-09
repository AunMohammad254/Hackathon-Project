/**
 * SEC-09: Sanitize user input before embedding in AI prompts.
 * Defends against prompt injection attacks by:
 * 1. Stripping control characters
 * 2. Truncating excessively long inputs
 * 3. Escaping common prompt delimiter patterns
 */

const PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/gi,
    /disregard\s+(all\s+)?(previous|prior|above)/gi,
    /you\s+are\s+now\s+/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
    /<\|im_start\|>/gi,
];

/**
 * Sanitize a single string input for safe embedding in a prompt.
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 2000 chars)
 * @returns Sanitized string
 */
export const sanitizePromptInput = (input: string, maxLength = 2000): string => {
    if (!input || typeof input !== 'string') return '';

    let sanitized = input;

    // Strip control characters (keep newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Neutralize common prompt injection patterns by wrapping in quotes context
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[filtered]');
    }

    // Truncate to max length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength) + '... [truncated]';
    }

    return sanitized.trim();
};

/**
 * Sanitize an array of strings (e.g., symptoms list).
 */
export const sanitizePromptArray = (items: string[], maxItemLength = 200): string[] => {
    if (!Array.isArray(items)) return [];
    return items
        .filter(item => typeof item === 'string' && item.trim().length > 0)
        .map(item => sanitizePromptInput(item, maxItemLength))
        .slice(0, 50); // Cap at 50 items max
};
