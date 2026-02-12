
import { logger } from './logger';

const API_LIMIT_KEY = 'github-api-rate-limited';
const API_LIMIT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Unified GitHub Rate Limiting Utility
 */
export const GithubRateLimiter = {
    isLimited(): boolean {
        const limitedUntil = sessionStorage.getItem(API_LIMIT_KEY);
        if (!limitedUntil) return false;

        const now = Date.now();
        if (now > parseInt(limitedUntil, 10)) {
            sessionStorage.removeItem(API_LIMIT_KEY);
            return false;
        }
        return true;
    },

    setLimited() {
        const limitUntil = Date.now() + API_LIMIT_DURATION;
        sessionStorage.setItem(API_LIMIT_KEY, limitUntil.toString());
        logger.warn(`GitHub API Rate Limit set until ${new Date(limitUntil).toLocaleTimeString()}`);
    },

    isOffline(): boolean {
        return !window.navigator.onLine;
    }
};
