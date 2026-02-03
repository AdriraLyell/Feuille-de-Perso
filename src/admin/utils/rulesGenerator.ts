import { APP_VERSION } from '../../constants';
import { RulesData } from '../../types/rules';

/**
 * Generates the JavaScript content for the rules.js file.
 * This wraps the rules JSON in a window assignment.
 * CRITICAL: Enforces current APP_VERSION and injects Timestamp for sync.
 */
export const generateRulesJSContent = (rules: RulesData): string => {
    // Clone and enforce metadata
    const exportRules = {
        ...rules,
        version: APP_VERSION,
        lastUpdated: Date.now()
    };
    return `window.EXTERNAL_RULES = ${JSON.stringify(exportRules, null, 4)};`;
};
