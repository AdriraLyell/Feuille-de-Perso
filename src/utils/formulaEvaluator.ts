import { CharacterSheetData } from '../types';

/**
 * Extracts a map of variable names to their values from the character sheet.
 */
export const getSheetVariables = (data: CharacterSheetData): Record<string, number> => {
    const vars: Record<string, number> = {};

    // 1. Special Variables
    vars['XP_TOTAL'] = parseFloat(data.experience?.gain || "0") || 0;

    let mysticSum = 0;
    if (data.skills) {
        Object.keys(data.skills).forEach(cat => {
            if (cat.toLowerCase().includes('mystique')) {
                data.skills[cat].forEach(skill => {
                    mysticSum += (skill.value || 0);
                });
            }
        });
    }
    vars['SUM_MYSTIC'] = mysticSum;

    // 2. Attributes
    if (data.attributes) {
        Object.values(data.attributes).flat().forEach(attr => {
            if (attr.name) vars[attr.name] = parseInt(attr.val2 || "0") || 0;
        });
    }

    // 3. Secondary Attributes
    if (data.secondaryAttributes) {
        Object.values(data.secondaryAttributes).flat().forEach(attr => {
            if (attr.name) vars[attr.name] = parseInt(attr.val2 || "0") || 0;
        });
    }

    // 4. Skills
    if (data.skills) {
        Object.values(data.skills).flat().forEach(skill => {
            if (skill.name) vars[skill.name] = skill.value || 0;
        });
    }

    return vars;
};

/**
 * Evaluates a given formula against a character's state.
 */
export const evaluateFormula = (formula: string, data: CharacterSheetData): number => {
    if (!formula) return 0;
    let computedFormula = formula;

    const sheetVars = getSheetVariables(data);

    // Sort variable names by length descending so that "Armes de jet" is matched before "Armes"
    const sortedKeys = Object.keys(sheetVars).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
        // Skip empty keys
        if (!key.trim()) continue;

        // Escape regex special characters from the key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match whole word, case insensitive
        const regex = new RegExp(`\\b${escapedKey}\\b`, 'gi');

        if (regex.test(computedFormula)) {
            computedFormula = computedFormula.replace(regex, sheetVars[key].toString());
        }
    }

    try {
        // Safe evaluation
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${computedFormula}`)();
        return isNaN(result) ? 0 : Math.floor(result);
    } catch (e) {
        console.warn(`Formula evaluation failed for "${formula}" -> "${computedFormula}"`);
        return 0;
    }
};
