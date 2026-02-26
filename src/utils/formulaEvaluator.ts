import { Parser } from 'expr-eval';
import { CharacterSheetData } from '../types';

const parser = new Parser();

/**
 * Extracts a map of variable names to their values from the character sheet.
 * Includes static values (attributes, skills) and aggregate calculations.
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

    // 5. Aggregate Formula Variables (SUM, COUNT, etc.)
    if (data.formulaVariables && Array.isArray(data.formulaVariables)) {
        data.formulaVariables.forEach((fVar: any) => {
            if (!fVar.name) return;
            vars[fVar.name] = calculateAggregate(data, fVar);
        });
    }

    // 6. MJ Variables (from formulaLibrary)
    // We do multiple passes to resolve dependencies
    if (data.formulaLibrary && Array.isArray(data.formulaLibrary)) {
        const formulaEntries = data.formulaLibrary.filter(f => f.type === 'effect');
        const memo = new Map<string, number>();
        const visiting = new Set<string>();

        const resolveGlobal = (name: string): number => {
            if (memo.has(name)) return memo.get(name)!;
            const entry = formulaEntries.find(f => f.name === name);
            if (!entry || visiting.has(name)) return vars[name] || 0;

            visiting.add(name);
            try {
                // Pass the CURRENT vars (including aggregates) but avoid infinite recursion of getSheetVariables
                const result = evaluateWithContext(entry.formula, { ...vars, ...Object.fromEntries(memo) }, resolveGlobal);
                memo.set(name, result);
                return result;
            } catch {
                return 0;
            } finally {
                visiting.delete(name);
            }
        };

        formulaEntries.forEach(f => {
            if (f.name && !memo.has(f.name)) {
                vars[f.name] = resolveGlobal(f.name);
            }
        });
    }

    return vars;
};

/**
 * Pure evaluation function that doesn't re-calculate the whole sheet.
 */
const evaluateWithContext = (formula: string, context: Record<string, number>, resolver?: (name: string) => number): number => {
    if (!formula) return 0;
    try {
        const expr = parser.parse(formula);

        // Custom resolver for missing variables if needed
        if (resolver) {
            expr.variables().forEach(v => {
                if (context[v] === undefined) {
                    context[v] = resolver(v);
                }
            });
        }

        const result = expr.evaluate(context);
        return isNaN(result) ? 0 : Math.floor(Number(result));
    } catch {
        return 0;
    }
};

/**
 * Helper to calculate aggregate values (Sum of Skills, Max Attribute, etc.)
 */
const calculateAggregate = (data: any, fVar: any): number => {
    let baseList: any[] = [];
    switch (fVar.target) {
        case 'skills':
            baseList = Object.values(data.skills || {}).flat();
            break;
        case 'attributes':
            baseList = Object.values(data.attributes || {}).flat();
            break;
        case 'secondaryAttributes':
            baseList = Object.values(data.secondaryAttributes || {}).flat();
            break;
        case 'mysticAbilities':
            baseList = (data.mysticAbilities || []).filter((s: any) => typeof s !== 'string');
            break;
        default: return 0;
    }

    // Apply filtering
    let filteredList = baseList;
    if (fVar.filterTarget && fVar.filterValue) {
        const val = fVar.filterValue.toLowerCase();
        if (fVar.filterTarget === 'tag') {
            filteredList = baseList.filter(item => item.tag && item.tag.toLowerCase().includes(val));
        } else if (fVar.filterTarget === 'category') {
            // Need to know category for skills... this is tricky in flattened list
            // For now, assume it's filtered elsewhere or skip
        }
    }

    // Perform operation
    const values = filteredList.map(item => {
        if (typeof item.value === 'number') return item.value;
        if (typeof item.val2 === 'string') return parseInt(item.val2) || 0;
        return 0;
    });

    if (values.length === 0) return 0;

    switch (fVar.operation) {
        case 'sum': return values.reduce((a, b) => a + b, 0);
        case 'count': return values.filter(v => v > 0).length;
        case 'highest': return Math.max(...values);
        case 'average': return values.reduce((a, b) => a + b, 0) / values.length;
        default: return 0;
    }
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
