import { get as getCache, set as setCache, entries } from 'idb-keyval';
import { RulesData } from '../types/rules';
import { logger } from '../utils/logger';

const RULES_CACHE_PREFIX = 'rpg-rules-';
const ACTIVE_RULES_KEY = 'rpg-rules-cache'; // Legacy key used by RulesContext

/**
 * OfflineStorageService
 * 
 * Manages IndexedDB caching for campaign rules.
 * Ensures the app can load even without network.
 */
export const OfflineStorageService = {

    /**
     * Save rules to persistent cache.
     * We save both as "active" (for next boot) and by ID (for campaign switching).
     */
    async saveRules(rules: RulesData): Promise<void> {
        if (!rules) return;

        try {
            // 1. Save as latest active rules
            await setCache(ACTIVE_RULES_KEY, rules);

            // 2. If it's a campaign, save by ID for secondary fallback
            if (rules.settingId) {
                await setCache(`${RULES_CACHE_PREFIX}${rules.settingId}`, rules);
            }

            logger.log(`[OfflineStorage] Rules ${rules.settingId || 'default'} saved to cache.`);
        } catch (err) {
            logger.error('[OfflineStorage] Failed to save rules to cache:', err);
        }
    },

    /**
     * Load the latest active rules from cache.
     */
    async getActiveRules(): Promise<RulesData | null> {
        try {
            const rules = await getCache(ACTIVE_RULES_KEY);
            return rules as RulesData || null;
        } catch (err) {
            logger.error('[OfflineStorage] Failed to load active rules from cache:', err);
            return null;
        }
    },

    /**
     * Search for specific campaign rules in cache.
     */
    async getRulesBySettingId(settingId: string): Promise<RulesData | null> {
        try {
            const rules = await getCache(`${RULES_CACHE_PREFIX}${settingId}`);
            return rules as RulesData || null;
        } catch (err) {
            logger.error(`[OfflineStorage] Failed to load rules for ${settingId}:`, err);
            return null;
        }
    },

    /**
     * List all cached campaigns (useful for offline campaign switching).
     */
    async listCachedCampaigns(): Promise<Array<{ id: string, name: string, version: string }>> {
        try {
            const allEntries = await entries();
            return allEntries
                .filter(([key]) => String(key).startsWith(RULES_CACHE_PREFIX) && key !== ACTIVE_RULES_KEY)
                .map(([_, value]) => {
                    const rules = value as RulesData;
                    return {
                        id: rules.settingId || 'unknown',
                        name: rules.settingName || 'Sans nom',
                        version: rules.version
                    };
                });
        } catch (err) {
            logger.error('[OfflineStorage] Failed to list cached campaigns:', err);
            return [];
        }
    }
};
