import { useState, useCallback } from 'react';
import { LibraryLoader } from '../../services/library/LibraryLoader';
import { ItemUsageDetail } from '../../types/usageTypes';

export type ItemType = 'trait' | 'skill' | 'background' | 'counter' | 'mystic' | 'specialization';

/**
 * Hook to manage loading and caching of item usage details (campaigns/characters)
 */
export function useItemUsageDetails(currentSettingId: string, itemType: ItemType) {
    const [cache] = useState(() => new Map<string, ItemUsageDetail>());
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const loadDetails = useCallback(async (itemId: string) => {
        // Only load if not already in cache and not currently loading
        if (cache.has(itemId) || loadingIds.has(itemId)) return;

        setLoadingIds(prev => {
            const next = new Set(prev);
            next.add(itemId);
            return next;
        });

        try {
            const details = await LibraryLoader.loadItemUsageDetails(itemId, currentSettingId, itemType);
            cache.set(itemId, details);
            // Force a re-render to update components using the cache
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        } catch {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    }, [cache, currentSettingId, itemType, loadingIds]);

    return {
        loadDetails,
        usageDetailsCache: cache,
        loadingIds
    };
}
