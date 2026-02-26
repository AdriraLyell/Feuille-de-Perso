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

    // 2. Skills (Lower priority, might be overwritten by attributes/counters)
    if (data.skills) {
        Object.values(data.skills).flat().forEach(skill => {
            if (skill.name) {
                const name = skill.name.trim();
                vars[name] = skill.value || 0;
            }
        });
    }

    // 3. Counters
    if (data.counters) {
        Object.entries(data.counters).forEach(([key, value]) => {
            if (key === 'custom' && Array.isArray(value)) {
                value.forEach(c => {
                    if (c.name) vars[c.name.trim()] = c.value || 0;
                });
            } else if (value && !Array.isArray(value)) {
                // Use both ID (key) and Name if available
                vars[key] = (value as any).value || 0;
                if ((value as any).name) {
                    vars[(value as any).name.trim()] = (value as any).value || 0;
                }
            }
        });
    }

    // 4. Secondary Attributes
    if (data.secondaryAttributes) {
        Object.values(data.secondaryAttributes).flat().forEach(attr => {
            if (attr.name) {
                const name = attr.name.trim();
                const v1 = parseInt(attr.val1) || 0;
                const v2 = parseInt(attr.val2) || 0;
                const v3 = parseInt(attr.val3) || 0;
                vars[name] = v1 + v2 + v3;
            }
        });
    }

    // 5. Attributes (High priority for core attributes like Volonté)
    if (data.attributes) {
        Object.values(data.attributes).flat().forEach(attr => {
            if (attr.name) {
                const name = attr.name.trim();
                const v1 = parseInt(attr.val1) || 0;
                const v2 = parseInt(attr.val2) || 0;
                const v3 = parseInt(attr.val3) || 0;
                vars[name] = v1 + v2 + v3;
            }
        });
    }

    // 5. MJ Variables (from formulaLibrary)
    // We do multiple passes to resolve dependencies between variables
    if (data.formulaLibrary && Array.isArray(data.formulaLibrary)) {
        // Variables specifically marked as 'variable' are used as building blocks
        const variableEntries = data.formulaLibrary.filter(f => f.type === 'variable');
        const memo = new Map<string, number>();
        const visiting = new Set<string>();

        const resolveGlobal = (name: string): number => {
            if (memo.has(name)) return memo.get(name)!;
            const entry = variableEntries.find(f => (f.code && f.code === name) || f.name === name);
            if (!entry || visiting.has(name)) return vars[name] || 0;

            visiting.add(name);
            try {
                let result = 0;
                if (entry.aggregateConfig) {
                    // Aggregate Variable
                    result = calculateAggregate(data, entry.aggregateConfig);
                } else if (entry.formula) {
                    // Equation Variable
                    // Pass the CURRENT vars (including aggregates found so far)
                    result = evaluateWithContext(entry.formula, { ...vars, ...Object.fromEntries(memo) }, resolveGlobal);
                }
                memo.set(name, result);
                return result;
            } catch {
                return 0;
            } finally {
                visiting.delete(name);
            }
        };

        variableEntries.forEach(f => {
            const varName = f.code || f.name;
            if (varName && !memo.has(varName)) {
                vars[varName] = resolveGlobal(varName);
            }
        });
    }

    // 6. Legacy Formula Variables (Support fallback for temporary structures)
    if ((data as any).formulaVariables && Array.isArray((data as any).formulaVariables)) {
        (data as any).formulaVariables.forEach((fVar: any) => {
            if (!fVar.name) return;
            vars[fVar.name] = calculateAggregate(data, fVar);
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
export const calculateAggregate = (data: any, config: any): number => {
    let baseList: any[] = [];
    const targetType = config.targetType || config.target; // Support both names

    switch (targetType) {
        case 'skills':
            // Inject category/tag metadata from the map keys and definitions
            if (data.skills) {
                Object.entries(data.skills).forEach(([catId, skills]) => {
                    (skills as any[]).forEach(skill => {
                        let tagFallback = skill.tag || catId;

                        // 1. Direct check on the skill object (historical/migrated data)
                        if (skill.mysticAbilityId) {
                            tagFallback += ' Mystique';
                        }
                        // 2. Cross-reference with definitions to inject specialized tags (like Mystique)
                        else if (data.skillLibrary) {
                            const def = data.skillLibrary.find((d: any) => d.id === skill.definitionId);
                            if (def && def.mysticAbilityId) {
                                tagFallback += ' Mystique';
                            }
                        }

                        baseList.push({
                            ...skill,
                            category: catId,
                            tag: tagFallback
                        });
                    });
                });
            }
            break;
        case 'attributes':
            baseList = Object.values(data.attributes || {}).flat();
            break;
        case 'secondaryAttributes':
            baseList = Object.values(data.secondaryAttributes || {}).flat();
            break;
        case 'traits':
            baseList = data.traits || [];
            break;
        case 'mysticAbilities':
            baseList = (data.mysticAbilities || []).filter((s: any) => typeof s !== 'string');
            break;
        default: return 0;
    }

    // Apply filtering
    let filteredList = baseList;
    if (config.filterTarget && config.filterValue) {
        const val = config.filterValue.toLowerCase();
        if (config.filterTarget === 'tag') {
            // For skills/general: match tag OR category ID (allows matching "Mystique" if category key contains it)
            filteredList = baseList.filter(item =>
                (item.tag && item.tag.toLowerCase().includes(val)) ||
                (item.category && item.category.toLowerCase().includes(val))
            );
        } else if (config.filterTarget === 'category') {
            filteredList = baseList.filter(item => item.category && item.category.toLowerCase().includes(val));
        } else if (config.filterTarget === 'name') {
            filteredList = baseList.filter(item => item.name && item.name.toLowerCase().includes(val));
        }
    }

    // Perform operation
    const values = filteredList.map(item => {
        if (typeof item.value === 'number') return item.value;
        // Attributes/Secondary Attributes: Sum val1 + val2 + val3
        if (item.val1 !== undefined || item.val2 !== undefined || item.val3 !== undefined) {
            const v1 = parseInt(item.val1 || "0") || 0;
            const v2 = parseInt(item.val2 || "0") || 0;
            const v3 = parseInt(item.val3 || "0") || 0;
            return v1 + v2 + v3;
        }
        if (typeof item.level === 'number') return item.level; // Traits
        return 0;
    });

    if (values.length === 0) return 0;

    switch (config.operation) {
        case 'sum': return values.reduce((a, b) => a + b, 0);
        case 'count': return values.filter(v => v > 0).length;
        case 'max':
        case 'highest': return Math.max(...values);
        case 'avg':
        case 'average': return values.reduce((a, b) => a + b, 0) / values.length;
        default: return 0;
    }
};

/**
 * Evaluates a given formula against a character's state.
 */
export const evaluateFormula = (formula: string, data: CharacterSheetData & { variables?: Record<string, number> }, entry?: any): number => {
    // If it's an aggregate formula, calculate it directly
    if (entry?.aggregateConfig) {
        return calculateAggregate(data, entry.aggregateConfig);
    }

    if (!formula) return 0;

    try {
        const sheetVars = getSheetVariables(data);
        const context = { ...sheetVars };

        // Use expr-eval parser
        const expr = parser.parse(formula);

        // Map undefined variables to 0 to prevent evaluation errors
        expr.variables().forEach(v => {
            if (context[v] === undefined) context[v] = 0;
        });

        // Evaluate with safe context
        const result = expr.evaluate(context);

        return isNaN(result) ? 0 : Math.floor(Number(result));
    } catch (e) {
        // Fallback for rough editing
        return 0;
    }
};
