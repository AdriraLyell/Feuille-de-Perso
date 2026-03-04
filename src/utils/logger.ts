/**
 * Conditional logger that respects import.meta.env.DEV
 * Logs are suppressed in production builds
 */
export const logger = {
    /**
     * Dev-only log - suppressed in production
     */
    log: (...args: unknown[]) => {
        if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[APP]', ...args);
        }
    },

    /**
     * Dev-only warning - suppressed in production
     */
    warn: (...args: unknown[]) => {
        if (import.meta.env.DEV) {
            console.warn('[WARN]', ...args);
        }
    },

    /**
     * Always visible error logging
     */
    error: (...args: unknown[]) => {
        console.error('[ERROR]', ...args);
    },

    /**
     * Dev-only info - suppressed in production
     */
    info: (...args: unknown[]) => {
        if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.info('[INFO]', ...args);
        }
    }
};
// Agent Alpha: Precision Check
