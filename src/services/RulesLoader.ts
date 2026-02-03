import { RulesData } from '../types/rules';

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
                // Fetch with cache busting
                const timestamp = new Date().getTime();
                // Note: We use the correct path 'data/rules.js' relative to root
                // Assuming SPA is at root
                const response = await fetch(`./data/rules.js?v=${timestamp}`);

                if (response.ok) {
                    const text = await response.text();
                    // rules.js content is: window.EXTERNAL_RULES = {...};
                    // We need to extract the JSON part.
                    // This is safer than eval()
                    const jsonMatch = text.match(/window\.EXTERNAL_RULES\s*=\s*(\{[\s\S]*\});?/);
                    if (jsonMatch && jsonMatch[1]) {
                        const parsedRules = JSON.parse(jsonMatch[1]);
                        console.log('[RulesLoader] Fresh rules loaded via Fetch (Cache Busted)', parsedRules);
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
