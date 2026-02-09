import { RulesData } from '../types/rules';
import { RAW_RULES_URL, REPO_OWNER, REPO_NAME } from '../constants';
import { ErrorService } from './ErrorService';
import { CampaignService } from './CampaignService';



// Helper to get query param (for cache busting)
const getQueryParam = (name: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

// API Rate Limit Backoff Helpers
const API_LIMIT_KEY = 'github-api-rate-limited';
const API_LIMIT_DURATION = 15 * 60 * 1000; // 15 minutes

const isApiRateLimited = (): boolean => {
    const limitedUntil = sessionStorage.getItem(API_LIMIT_KEY);
    if (!limitedUntil) return false;

    const now = Date.now();
    if (now > parseInt(limitedUntil, 10)) {
        sessionStorage.removeItem(API_LIMIT_KEY);
        return false;
    }
    return true;
};

const setApiRateLimited = () => {
    const limitUntil = Date.now() + API_LIMIT_DURATION;
    sessionStorage.setItem(API_LIMIT_KEY, limitUntil.toString());
};

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
                console.log('[RulesLoader] Attempting to fetch rules from Supabase for ID:', settingId);
                const dbRules = await CampaignService.loadSetting(settingId);
                if (dbRules) {
                    console.log('[RulesLoader] Rules loaded from Supabase:', dbRules);
                    // source property should already be set to 'database' by CampaignService.loadSetting
                    // but we ensure it here too.
                    dbRules.source = 'database';
                    window.EXTERNAL_RULES = dbRules;
                    return dbRules;
                }
                console.warn('[RulesLoader] Campaign not found or private in Supabase. Falling back to default rules.');
            } catch (dbErr) {
                console.warn('[RulesLoader] Supabase load failed, falling back to default rules.', dbErr);
            }
        }

        if (isOnline) {
            // STRATEGY 1: GitHub API (Instant Update)
            if (!isApiRateLimited()) {
                try {
                    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/public/data/rules.js?ref=main`;
                    console.log('[RulesLoader] Attempting to fetch rules via API:', apiUrl);

                    const apiResponse = await fetch(apiUrl, {
                        headers: { 'Accept': 'application/vnd.github.v3.raw' },
                        cache: 'no-store'
                    });

                    if (apiResponse.ok) {
                        const text = await apiResponse.text();
                        const parsedRules = parseRulesFromText(text);
                        if (parsedRules) {
                            console.log('[RulesLoader] Fresh rules loaded via API', parsedRules);
                            parsedRules.source = 'api';
                            window.EXTERNAL_RULES = parsedRules;
                            return parsedRules;
                        }
                    } else if (apiResponse.status === 403 || apiResponse.status === 429) {
                        console.warn('[RulesLoader] API Rate Limit hit during load. Falling back to Raw CDN.');
                        setApiRateLimited();
                    }
                } catch (apiErr) {
                    console.warn('[RulesLoader] API load failed, trying RAW.', apiErr);
                }
            } else {
                console.log('[RulesLoader] API is currently rate-limited (backoff). Skipping to RAW.');
            }

            // STRATEGY 2: Fallback to Raw CDN
            try {
                const timestamp = new Date().getTime();
                const rawUrlCacheBusted = `${RAW_RULES_URL}?v=${timestamp}`;
                console.log('[RulesLoader] Falling back to RAW rules:', rawUrlCacheBusted);

                let response = await fetch(rawUrlCacheBusted, { cache: 'no-store' });

                if (!response.ok) {
                    console.warn('[RulesLoader] RAW fetch failed, falling back to relative path.');
                    response = await fetch(`./data/rules.js?v=${timestamp}`, { cache: 'no-store' });
                }

                if (response.ok) {
                    const text = await response.text();
                    const parsedRules = parseRulesFromText(text);
                    if (parsedRules) {
                        console.log('[RulesLoader] Fresh rules loaded (Content Fetch)', parsedRules);
                        parsedRules.source = 'api';
                        window.EXTERNAL_RULES = parsedRules;
                        return parsedRules;
                    }
                }
            } catch (fetchErr) {
                console.warn('[RulesLoader] Failed to fetch fresh rules, falling back to cached global.', fetchErr);
            }
        }

        // 2. Fallback to Window Global (loaded via <script> tag)
        if (!window.EXTERNAL_RULES) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        if (window.EXTERNAL_RULES) {
            console.log('[RulesLoader] Rules loaded from Global (Script Tag):', window.EXTERNAL_RULES);
            if (!window.EXTERNAL_RULES.source) window.EXTERNAL_RULES.source = 'legacy';
            return window.EXTERNAL_RULES;
        }

        console.warn('[RulesLoader] No global rules found.');
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
            console.log('[RulesLoader] Checking update via Supabase for ID:', currentRules.settingId);
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
        if (!isApiRateLimited()) {
            const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/public/data/rules.js?ref=main`;

            console.log('[RulesLoader] Checking update via API...');
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
                            console.log('[RulesLoader] Update found via API!');
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
                console.warn('[RulesLoader] API Rate Limit hit. Falling back to Raw CDN.');
                setApiRateLimited();
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
        console.warn("[RulesLoader] Check update failed", e);
    }
    return false;
};
