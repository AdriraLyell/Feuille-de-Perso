import { Parser } from 'expr-eval';
import { CharacterSheetData } from '../types';
import { normalizeString, smartIncludes } from './stringUtils';
import { logger } from './logger';

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

    // 2. Skills (Lower priority, might be overwritten by attributes/counters)
    if (data.skills) {
        Object.values(data.skills).flat().forEach(skill => {
            if (skill.name) {
                const name = skill.name.trim();
                const val = skill.value || 0;
                vars[name] = val;

                const normalized = normalizeString(name);
                if (normalized !== name.toLowerCase()) {
                    vars[normalized] = val;
                }
            }
        });
    }

    // 3. Counters
    if (data.counters) {
        Object.entries(data.counters).forEach(([key, value]) => {
            if (key === 'custom' && Array.isArray(value)) {
                value.forEach(c => {
                    if (c.name) {
                        const name = c.name.trim();
                        vars[name] = c.value || 0;
                        const normalized = normalizeString(name);
                        if (normalized !== name.toLowerCase()) vars[normalized] = c.value || 0;
                    }
                });
            } else if (value && !Array.isArray(value)) {
                const val = (value as any).value || 0;
                vars[key] = val;
                if ((value as any).name) {
                    const name = (value as any).name.trim();
                    vars[name] = val;
                    const normalized = normalizeString(name);
                    if (normalized !== name.toLowerCase()) vars[normalized] = val;
                }
            }
        });
    }

    // 4. Secondary Attributes
    if (data.secondaryAttributes) {
        Object.values(data.secondaryAttributes).flat().forEach(attr => {
            if (attr.name) {
                const name = attr.name.trim();
                const total = (parseInt(attr.val1) || 0) + (parseInt(attr.val2) || 0) + (parseInt(attr.val3) || 0);
                vars[name] = total;
                const normalized = normalizeString(name);
                if (normalized !== name.toLowerCase()) vars[normalized] = total;
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
                const total = v1 + v2 + v3;

                vars[name] = total;
                // Add normalized variant (e.g., Volonte for Volonté)
                const normalized = normalizeString(name);
                if (normalized !== name.toLowerCase()) {
                    vars[normalized] = total;
                }
            }
        });
    }

    // 5. MJ Variables (from formulaLibrary) - RESOLVED LAST TO HAVE PRIORITY
    // We do multiple passes to resolve dependencies between variables
    if (data.formulaLibrary && Array.isArray(data.formulaLibrary)) {
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
                    result = calculateAggregate(data, entry.aggregateConfig);
                } else if (entry.formula) {
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

        // Pass 1: Resolve all MJ variables to populate the memo
        variableEntries.forEach(f => {
            const varName = f.code || f.name;
            if (varName) resolveGlobal(varName);
        });

        // Pass 2: Inject everything from memo into vars
        memo.forEach((val, varName) => {
            vars[varName] = val;
            // Also add normalized variant for MJ variables
            const normalized = normalizeString(varName);
            if (normalized !== varName.toLowerCase()) vars[normalized] = val;
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
 * Gets the specific elements involved in an aggregate calculation (e.g. all mystic skills)
 */
export const getAggregateDetails = (data: any, config: any): { name: string, value: number, category?: string, tag?: string }[] => {
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
                        // 2. Cross-reference with definitions (local library)
                        else if (data.skillLibrary) {
                            // Match by definitionId OR by normalized name fallback
                            const def = data.skillLibrary.find((d: any) =>
                                (skill.definitionId && d.id === skill.definitionId) ||
                                (skill.name && d.name && normalizeString(skill.name) === normalizeString(d.name))
                            );
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
            baseList = [
                ...(data.page2?.avantages || []),
                ...(data.page2?.desavantages || [])
            ];
            break;
        case 'mysticAbilities':
            baseList = (data.mysticAbilities || []).filter((s: any) => typeof s !== 'string');
            break;
        default: return [];
    }

    // Apply filtering
    let filteredList = baseList;
    if (config.filterTarget && config.filterValue) {
        if (config.filterTarget === 'tag') {
            filteredList = baseList.filter(item =>
                smartIncludes(item.tag, config.filterValue) ||
                smartIncludes(item.category, config.filterValue)
            );
        } else if (config.filterTarget === 'category') {
            filteredList = baseList.filter(item => smartIncludes(item.category, config.filterValue));
        } else if (config.filterTarget === 'name') {
            filteredList = baseList.filter(item => smartIncludes(item.name, config.filterValue));
        }
    }

    // Perform extraction
    const details = filteredList.map(item => {
        let value = 0;
        if (typeof item.value === 'number') {
            value = item.value;
        } else if (typeof item.value === 'string') {
            value = parseInt(item.value, 10) || 0;
        }
        // Attributes/Secondary Attributes: Sum val1 + val2 + val3
        else if (item.val1 !== undefined || item.val2 !== undefined || item.val3 !== undefined) {
            const v1 = parseInt(item.val1 || "0") || 0;
            const v2 = parseInt(item.val2 || "0") || 0;
            const v3 = parseInt(item.val3 || "0") || 0;
            value = v1 + v2 + v3;
        }
        else if (typeof item.level === 'number') {
            value = item.level; // Legacy traits or custom entries
        }

        return {
            name: item.name || '',
            value,
            category: item.category,
            tag: item.tag
        };
    });

    return details;
};

/**
 * Helper to calculate aggregate values (Sum of Skills, Max Attribute, etc.)
 */
export const calculateAggregate = (data: any, config: any): number => {
    const details = getAggregateDetails(data, config);
    if (details.length === 0) return 0;

    const op = config.operation?.toLowerCase();
    const values = details.map(d => d.value);

    let result = 0;
    switch (op) {
        case 'sum': result = values.reduce((a, b) => a + b, 0); break;
        case 'count': result = values.filter(v => v > 0).length; break;
        case 'max':
        case 'highest': result = Math.max(...values); break;
        case 'avg':
        case 'average': result = values.reduce((a, b) => a + b, 0) / values.length; break;
        default: result = 0;
    }

    return result;
};

/**
 * Evaluates a given formula against a character's state.
 */
export const evaluateFormula = (
    formula: string,
    data: CharacterSheetData & { variables?: Record<string, number> },
    options: {
        entry?: any,
        traitLevel?: number,
        scenariosCount?: number
    } = {}
): number => {
    // If it's an aggregate formula, calculate it directly
    if (options.entry?.aggregateConfig) {
        return calculateAggregate(data, options.entry.aggregateConfig);
    }

    if (!formula) return 0;

    try {
        const sheetVars = getSheetVariables(data);
        const context = { ...sheetVars };

        // Inject contextual variables from options
        if (options.traitLevel !== undefined) {
            context['TRAIT_LEVEL'] = options.traitLevel;
        }
        if (options.scenariosCount !== undefined) {
            context['SCENARIOS_COUNT'] = options.scenariosCount;
        }

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
