/**
 * A simple generic TTL in-memory cache for the hackathon MVP.
 * Removes the need for Redis while providing basic caching for slow endpoints.
 */
class TTLCache<T> {
    private cache = new Map<string, { data: T; expiresAt: number }>();

    /**
     * Get item from cache if it exists and hasn't expired
     */
    get(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    /**
     * Set item in cache with a Time-To-Live in milliseconds
     */
    set(key: string, data: T, ttlMs: number): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
        });
    }

    /**
     * Manually invalidate a specific cache key
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }
}

// Global cache instances for specific domains
export const doctorCache = new TTLCache<any[]>();
export const adminStatsCache = new TTLCache<any>();
