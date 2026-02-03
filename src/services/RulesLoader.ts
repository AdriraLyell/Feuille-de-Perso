import { RulesData } from '../types/rules';

// @ts-ignore
declare global {
    interface Window {
        EXTERNAL_RULES?: RulesData;
    }
}

export const loadRules = async (): Promise<RulesData | null> => {
    try {
        // Wait a bit to ensure script is loaded (though it should be synchronous in head)
        await new Promise(resolve => setTimeout(resolve, 50));

        if (window.EXTERNAL_RULES) {
            console.log('[RulesLoader] Rules loaded from Global (Offline Mode):', window.EXTERNAL_RULES);
            return window.EXTERNAL_RULES;
        }

        console.warn('[RulesLoader] No global rules found. Creating fallback or retrying fetch...');

        // Fallback or Error
        return null;
    } catch (error) {
        console.error('[RulesLoader] Error loading rules:', error);
        return null;
    }
};
