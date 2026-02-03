import { RulesData } from '../types/rules';
import { RAW_RULES_URL } from '../constants';

// @ts-ignore
declare global {
    interface Window {
        EXTERNAL_RULES?: RulesData;
    }
}

// Helper to get query param (for cache busting)
const getQueryParam = (name: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

export const loadRules = async (): Promise<RulesData | null> => {
    try {
        // 1. If we are ONLINE (http/https), try to fetch fresh content
        const isOnline = window.location.protocol.startsWith('http');

        if (isOnline) {
            try {
                // Fetch from RAW GitHub (Instant Update, bypasses Pages Build)
                const timestamp = new Date().getTime();
                const rawUrlCacheBusted = `${RAW_RULES_URL}?v=${timestamp}`;

                console.log('[RulesLoader] Attempting to fetch RAW rules from:', rawUrlCacheBusted);

                let response = await fetch(rawUrlCacheBusted, { cache: 'no-store' });

                // Fallback to relative path if RAW fails (e.g. network block)
                if (!response.ok) {
                    console.warn('[RulesLoader] RAW fetch failed, falling back to relative path.');
                    response = await fetch(`./data/rules.js?v=${timestamp}`, { cache: 'no-store' });
                }

                if (response.ok) {
                    const text = await response.text();
                    // rules.js content is: window.EXTERNAL_RULES = {...};
                    // Extract JSON
                    const jsonMatch = text.match(/window\.EXTERNAL_RULES\s*=\s*(\{[\s\S]*\});?/);
                    if (jsonMatch && jsonMatch[1]) {
                        const parsedRules = JSON.parse(jsonMatch[1]);
                        console.log('[RulesLoader] Fresh rules loaded', parsedRules);
                        // Update global for consistency
                        window.EXTERNAL_RULES = parsedRules;
                        return parsedRules;
                    }
                }
            } catch (fetchErr) {
                console.warn('[RulesLoader] Failed to fetch fresh rules, falling back to cached global.', fetchErr);
            }
        }

        // 2. Fallback to Window Global (loaded via <script> tag)
        // This handles:
        // - File:// protocol (Offline)
        // - Cached version if fetch failed
        // - First load race conditions (though script is usually blocking)

        // Wait a bit to ensure script is loaded (blocking scripts usually run before module execution, but just in case)
        if (!window.EXTERNAL_RULES) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        if (window.EXTERNAL_RULES) {
            console.log('[RulesLoader] Rules loaded from Global (Script Tag):', window.EXTERNAL_RULES);
            return window.EXTERNAL_RULES;
        }

        console.warn('[RulesLoader] No global rules found. Creating fallback or retrying fetch...');
        return null;

    } catch (error) {
        console.error('[RulesLoader] Error loading rules:', error);
        return null;
    }
};

export const checkForUpdate = async (currentRules: RulesData | null): Promise<boolean> => {
    if (!currentRules) return false;

    try {
        const rawUrlCacheBusted = `${RAW_RULES_URL}?v=${Date.now()}`;
        const response = await fetch(rawUrlCacheBusted, { cache: 'no-store' }); // Head request might be enough if we trusted headers, but we need body for timestamp

        if (response.ok) {
            const text = await response.text();
            const jsonMatch = text.match(/window\.EXTERNAL_RULES\s*=\s*(\{[\s\S]*\});?/);
            if (jsonMatch && jsonMatch[1]) {
                const remoteRules = JSON.parse(jsonMatch[1]) as RulesData;

                // Compare Timestamps (Precise)
                if (remoteRules.lastUpdated && currentRules.lastUpdated) {
                    return remoteRules.lastUpdated > currentRules.lastUpdated;
                }

                // Fallback to Version (Legacy)
                if (remoteRules.version !== currentRules.version) {
                    return remoteRules.version > currentRules.version; // String Comparison is weak but okay for now
                }
            }
        }
    } catch (e) {
        console.warn("[RulesLoader] Check update failed", e);
    }
    return false;
};
