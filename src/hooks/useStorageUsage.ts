import { useState, useEffect, useCallback } from 'react';
import { checkStorageQuota } from '../imageDB';
import { logger } from '../utils/logger';

export interface StorageStats {
    usage: number;
    quota: number;
    percent: number;
    isCritical: boolean; // > 90%
    isWarning: boolean;  // > 70%
}

export const useStorageUsage = () => {
    const [stats, setStats] = useState<StorageStats | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const result = await checkStorageQuota();
            const percent = Math.min(100, Math.round((result.usage / result.quota) * 100));

            setStats({
                usage: result.usage,
                quota: result.quota,
                percent,
                isCritical: percent >= 90,
                isWarning: percent >= 70
            });
        } catch (error) {
            logger.error('Failed to fetch storage stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();

        // Listen for storage events (though it doesn't trigger on own tab changes usually, 
        // we can trigger manually if needed, or just rely on refresh when opening menus)
        const handleFocus = () => refresh();
        window.addEventListener('focus', handleFocus);

        return () => window.removeEventListener('focus', handleFocus);
    }, [refresh]);

    return { stats, loading, refresh };
};
