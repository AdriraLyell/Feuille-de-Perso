import { RulesData } from '../../types/rules';

/**
 * Generates the JavaScript content for the rules.js file.
 * This wraps the rules JSON in a window assignment.
 */
export const generateRulesJSContent = (rules: RulesData): string => {
    return `window.EXTERNAL_RULES = ${JSON.stringify(rules, null, 4)};`;
};
