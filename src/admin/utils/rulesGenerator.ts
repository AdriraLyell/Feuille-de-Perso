import { APP_VERSION } from '../../constants/app';
import { RulesData } from '../../types/rules';

/**
 * Generates the JSON content for the rules.json file.
 * CRITICAL: Enforces current APP_VERSION and injects Timestamp for sync.
 */
export const generateRulesJSONContent = (rules: RulesData): string => {
    // Clone and enforce metadata
    const exportRules = {
        ...rules,
        version: APP_VERSION,
        lastUpdated: Date.now()
    };
    return JSON.stringify(exportRules, null, 4);
};
