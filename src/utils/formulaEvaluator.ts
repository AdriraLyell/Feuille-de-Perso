import { Parser } from 'expr-eval';
import { CharacterSheetData } from '../types';

const parser = new Parser();

/**
 * Extracts a map of variable names to their values from the character sheet.
 */
export const getSheetVariables = (data: CharacterSheetData & { variables?: Record<string, number> }): Record<string, number> => {
    const vars: Record<string, number> = {};

    // 0. Explicit variables passed in (e.g., TRAIT_LEVEL)
    if (data.variables) {
        Object.assign(vars, data.variables);
    }

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
export const evaluateFormula = (formula: string, data: CharacterSheetData & { variables?: Record<string, number> }): number => {
    if (!formula) return 0;

    try {
        const sheetVars = getSheetVariables(data);

        // Use expr-eval parser
        const expr = parser.parse(formula);

        // Evaluate with variables
        // expr-eval handles missing variables by setting them to undefined (which might result in NaN or error)
        // We'll provide the sheetVars as context.
        const result = expr.evaluate(sheetVars);

        return isNaN(result) ? 0 : Math.floor(Number(result));
    } catch (e) {
        // Fallback for rough editing - if it fails to parse because user is currently typing
        // or using unknown symbols/variables
        console.warn(`expr-eval failed for "${formula}":`, e);
        return 0;
    }
};
