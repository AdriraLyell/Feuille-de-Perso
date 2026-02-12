import { RulesData } from '../types/rules';
import { RAW_RULES_URL, REPO_OWNER, REPO_NAME } from '../constants';
import { ErrorService } from './ErrorService';
import { CampaignService } from './CampaignService';
import { logger } from '../utils/logger';
import { GithubRateLimiter } from '../utils/githubUtils';
import { OfflineStorageService } from './OfflineStorageService';



import { defaultRules } from '../data/defaultRules';

// Helper to get query param (for cache busting)
const getQueryParam = (name: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

// Rate limit handled by GithubRateLimiter utility

// Helper to get setting ID from URL
const getSettingIdFromUrl = (): string | null => {
    return getQueryParam('s') || getQueryParam('setting');
};

export const loadRules = async (forceSettingId?: string): Promise<RulesData | null> => {
    try {
        const isOffline = GithubRateLimiter.isOffline();
        const settingId = forceSettingId || getSettingIdFromUrl();

        // OFFLINE FIRST: If offline, we MUST use cache or legacy
        if (isOffline) {
            logger.log('[RulesLoader] Device is offline. Using cache strategies.');
            const cached = settingId ? await OfflineStorageService.getRulesBySettingId(settingId) : await OfflineStorageService.getActiveRules();
            if (cached) {
                logger.log('[RulesLoader] Rules loaded from Offline cache.');
                cached.source = 'cache';
                return cached;
            }
            logger.warn('[RulesLoader] No cached rules found while offline. Using default backup.');
            return defaultRules;
        }

        if (settingId) {
            // STRATEGY 0: Supabase (Online First)
            try {
                logger.log('[RulesLoader] Attempting to fetch rules from Supabase for ID:', settingId);
                const dbRules = await CampaignService.loadSetting(settingId);
                if (dbRules) {
                    // Auto-cache
                    await OfflineStorageService.saveRules(dbRules);
                    return dbRules;
                }
                logger.warn('[RulesLoader] Campaign not found or private in Supabase (ID: ' + settingId + '). Falling back to cache if possible.');
            } catch (dbErr) {
                logger.warn('[RulesLoader] Supabase load failed for ID: ' + settingId + ', falling back back to cache.', dbErr);
                // Try cache as fallback for specific campaign
                const cached = await OfflineStorageService.getRulesBySettingId(settingId);
                if (cached) return cached;
            }
        }

        // STRATEGY 1: GitHub API (Online)
        if (!isOffline) {
            // STRATEGY 1: GitHub API (Instant Update)
            if (!GithubRateLimiter.isLimited()) {
                try {
                    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/public/data/rules.json?ref=main`;
                    logger.log('[RulesLoader] Attempting to fetch rules via API:', apiUrl);

                    const apiResponse = await fetch(apiUrl, {
                        headers: { 'Accept': 'application/vnd.github.v3.raw' },
                        cache: 'no-store'
                    });

                    if (apiResponse.ok) {
                        const parsedRules = await apiResponse.json() as RulesData;
                        if (parsedRules) {
                            logger.log('[RulesLoader] Fresh rules loaded via API', parsedRules);
                            parsedRules.source = 'api';
                            return parsedRules;
                        }
                        logger.warn('[RulesLoader] API returned empty JSON. Falling back to Raw CDN.');
                        GithubRateLimiter.setLimited();
                    } else if (apiResponse.status === 403 || apiResponse.status === 429) {
                        logger.warn('[RulesLoader] API Rate Limit hit. Falling back to Raw CDN.');
                        GithubRateLimiter.setLimited();
                    }
                } catch (apiErr) {
                    logger.warn('[RulesLoader] API load failed, trying RAW.', apiErr);
                }
            } else {
                logger.log('[RulesLoader] API is currently rate-limited (backoff). Skipping to RAW.');
            }

            // STRATEGY 2: Fallback to Raw CDN
            try {
                const timestamp = new Date().getTime();
                const rawUrlCacheBusted = `${RAW_RULES_URL}?v=${timestamp}`;
                logger.log('[RulesLoader] Falling back to RAW rules:', rawUrlCacheBusted);

                let response = await fetch(rawUrlCacheBusted, { cache: 'no-store' });

                if (!response.ok) {
                    logger.warn('[RulesLoader] RAW fetch failed, falling back to relative path.');
                    response = await fetch(`./data/rules.json?v=${timestamp}`, { cache: 'no-store' });
                }

                if (response.ok) {
                    const parsedRules = await response.json() as RulesData;
                    if (parsedRules) {
                        logger.log('[RulesLoader] Fresh rules loaded (Content Fetch)', parsedRules);
                        parsedRules.source = 'api';
                        return parsedRules;
                    }
                }
            } catch (fetchErr) {
                logger.warn('[RulesLoader] Failed to fetch fresh rules, falling back to cached global.', fetchErr);
            }
        }

        // LAST RESORT: Try general cache if everything else failed
        const generalCache = await OfflineStorageService.getActiveRules();
        if (generalCache) {
            logger.log('[RulesLoader] Falling back to general active cache.');
            return generalCache;
        }

        // ABSOLUTE LAST RESORT: Default Embedded Rules
        logger.log('[RulesLoader] Using Default Embedded Rules.');
        return defaultRules;

        logger.warn('[RulesLoader] No global rules found.');
        return null;

    } catch (error) {
        ErrorService.handleError(error, { context: 'RulesLoader', userMessage: "Erreur critique lors du chargement des règles." });
        return null;
    }
};

export const checkForUpdate = async (currentRules: RulesData | null): Promise<boolean> => {
    if (!currentRules) return false;

    try {
        if (GithubRateLimiter.isOffline()) return false;

        // STRATEGY 0: Supabase (Online First)
        if (currentRules.source === 'database' && currentRules.settingId) {
            logger.log('[RulesLoader] Checking update via Supabase for ID:', currentRules.settingId);
            const remoteRules = await CampaignService.loadSetting(currentRules.settingId);
            if (remoteRules) {
                if (remoteRules.lastUpdated && currentRules.lastUpdated) {
                    return remoteRules.lastUpdated > currentRules.lastUpdated;
                }
                return remoteRules.version !== currentRules.version;
            }
            return false;
        }

        // STRATEGY 1: GitHub API (Instant, No CDN Cache, but Rate Limited 60/h)
        if (!GithubRateLimiter.isLimited()) {
            const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/public/data/rules.json?ref=main`;

            logger.log('[RulesLoader] Checking update via API...');
            const apiResponse = await fetch(apiUrl, {
                headers: { 'Accept': 'application/vnd.github.v3.raw' },
                cache: 'no-store'
            });

            if (apiResponse.ok) {
                const remoteRules = await apiResponse.json() as RulesData;

                if (remoteRules) {
                    // Compare Timestamps
                    if (remoteRules.lastUpdated && currentRules.lastUpdated) {
                        if (remoteRules.lastUpdated > currentRules.lastUpdated) {
                            logger.log('[RulesLoader] Update found via API!');
                            return true;
                        }
                        return false; // API says we are up to date
                    }
                    // Fallback Version
                    if (remoteRules.version !== currentRules.version) {
                        return remoteRules.version > currentRules.version;
                    }
                    return false;
                }
            } else if (apiResponse.status === 403 || apiResponse.status === 429) {
                logger.warn('[RulesLoader] API Rate Limit hit. Falling back to Raw CDN.');
                GithubRateLimiter.setLimited();
            }
        }

        // STRATEGY 2: Fallback to Raw CDN (5min Cache Latency)
        const rawUrlCacheBusted = `${RAW_RULES_URL}?v=${Date.now()}`;
        const response = await fetch(rawUrlCacheBusted, { cache: 'no-store' });

        if (response.ok) {
            const remoteRules = await response.json() as RulesData;

            if (remoteRules) {
                // Compare Timestamps (Precise)
                if (remoteRules.lastUpdated && currentRules.lastUpdated) {
                    return remoteRules.lastUpdated > currentRules.lastUpdated;
                }

                // Fallback to Version (Legacy)
                if (remoteRules.version !== currentRules.version) {
                    return remoteRules.version > currentRules.version;
                }
            }
        }
    } catch (e) {
        logger.warn("[RulesLoader] Check update failed", e);
    }
    return false;
};
