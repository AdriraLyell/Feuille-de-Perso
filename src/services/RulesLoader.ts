import { RulesData } from '../types/rules';
import { RAW_RULES_URL, REPO_OWNER, REPO_NAME } from '../constants';
import { ErrorService } from './ErrorService';
import { CampaignService } from './CampaignService';
import { logger } from '../utils/logger';
import { GithubRateLimiter } from '../utils/githubUtils';



// Helper to get query param (for cache busting)
const getQueryParam = (name: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

// Rate limit handled by GithubRateLimiter utility

// Helper to parse rules from JS text
const parseRulesFromText = (text: string): RulesData | null => {
    const jsonMatch = text.match(/window\.EXTERNAL_RULES\s*=\s*(\{[\s\S]*\});?/);
    if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]) as RulesData;
    }
    return null;
};

// Helper to get setting ID from URL
const getSettingIdFromUrl = (): string | null => {
    return getQueryParam('s') || getQueryParam('setting');
};

export const loadRules = async (forceSettingId?: string): Promise<RulesData | null> => {
    try {
        const isOnline = window.location.protocol.startsWith('http');
        const settingId = forceSettingId || getSettingIdFromUrl();

        if (isOnline && settingId) {
            // STRATEGY 0: Supabase (Online First)
            try {
                logger.log('[RulesLoader] Attempting to fetch rules from Supabase for ID:', settingId);
                const dbRules = await CampaignService.loadSetting(settingId);
                if (dbRules) {
                    logger.log('[RulesLoader] Rules loaded from Supabase:', dbRules.settingId);
                    dbRules.source = 'database';
                    window.EXTERNAL_RULES = dbRules;
                    return dbRules;
                }
                logger.warn('[RulesLoader] Campaign not found or private in Supabase (ID: ' + settingId + '). Falling back to default rules.');
            } catch (dbErr) {
                logger.warn('[RulesLoader] Supabase load failed for ID: ' + settingId + ', falling back to default rules.', dbErr);
            }
        }

        if (isOnline) {
            // STRATEGY 1: GitHub API (Instant Update)
            if (!GithubRateLimiter.isLimited()) {
                try {
                    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/public/data/rules.js?ref=main`;
                    logger.log('[RulesLoader] Attempting to fetch rules via API:', apiUrl);

                    const apiResponse = await fetch(apiUrl, {
                        headers: { 'Accept': 'application/vnd.github.v3.raw' },
                        cache: 'no-store'
                    });

                    if (apiResponse.ok) {
                        const text = await apiResponse.text();
                        const parsedRules = parseRulesFromText(text);
                        if (parsedRules) {
                            logger.log('[RulesLoader] Fresh rules loaded via API', parsedRules);
                            parsedRules.source = 'api';
                            window.EXTERNAL_RULES = parsedRules;
                            return parsedRules;
                        }
                        logger.warn('[RulesLoader] API Rate Limit hit during load. Falling back to Raw CDN.');
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
                    response = await fetch(`./data/rules.js?v=${timestamp}`, { cache: 'no-store' });
                }

                if (response.ok) {
                    const text = await response.text();
                    const parsedRules = parseRulesFromText(text);
                    if (parsedRules) {
                        logger.log('[RulesLoader] Fresh rules loaded (Content Fetch)', parsedRules);
                        parsedRules.source = 'api';
                        window.EXTERNAL_RULES = parsedRules;
                        return parsedRules;
                    }
                }
            } catch (fetchErr) {
                logger.warn('[RulesLoader] Failed to fetch fresh rules, falling back to cached global.', fetchErr);
            }
        }

        // 2. Fallback to Window Global (loaded via <script> tag)
        if (!window.EXTERNAL_RULES) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        if (window.EXTERNAL_RULES) {
            logger.log('[RulesLoader] Rules loaded from Global (Script Tag):', window.EXTERNAL_RULES);
            if (!window.EXTERNAL_RULES.source) window.EXTERNAL_RULES.source = 'legacy';
            return window.EXTERNAL_RULES;
        }

        logger.warn('[RulesLoader] No global rules found.');
        return null;

    } catch (error) {
        ErrorService.handleError(error, { context: 'RulesLoader', userMessage: "Erreur critique lors du chargement des règles." });
        return null;
    }
};

export const checkForUpdate = async (currentRules: RulesData | null): Promise<boolean> => {
    if (!currentRules) return false;

    // Helper to parse rules from JS text
    const parseRulesFromText = (text: string): RulesData | null => {
        const jsonMatch = text.match(/window\.EXTERNAL_RULES\s*=\s*(\{[\s\S]*\});?/);
        if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]) as RulesData;
        }
        return null;
    };

    try {
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
            const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/public/data/rules.js?ref=main`;

            logger.log('[RulesLoader] Checking update via API...');
            const apiResponse = await fetch(apiUrl, {
                headers: { 'Accept': 'application/vnd.github.v3.raw' },
                cache: 'no-store'
            });

            if (apiResponse.ok) {
                const text = await apiResponse.text();
                const remoteRules = parseRulesFromText(text);

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
            const text = await response.text();
            const remoteRules = parseRulesFromText(text);

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
