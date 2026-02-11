/**
 * Conditional logger that respects import.meta.env.DEV
 * Logs are suppressed in production builds
 */
export const logger = {
    /**
     * Dev-only log - suppressed in production
     */
    log: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.log('[APP]', ...args);
        }
    },

    /**
     * Dev-only warning - suppressed in production
     */
    warn: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.warn('[WARN]', ...args);
        }
    },

    /**
     * Always visible error logging
     */
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args);
    },

    /**
     * Dev-only info - suppressed in production
     */
    info: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.info('[INFO]', ...args);
        }
    }
};
