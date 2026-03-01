import { RulesData } from '../types/rules';
import { Parser } from 'safe-expr-eval';

/**
 * Vérifie si la syntaxe d'une formule est valide via expr-eval
 */
export const isFormulaSyntaxValid = (formula?: string): boolean => {
    if (!formula || formula.trim() === '') return true;
    try {
        const parser = new Parser();
        parser.parse(formula);
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Vérifie si une cible existe dans les définitions de règles
 */
export const isTargetValid = (target: string, rules: RulesData): boolean => {
    if (!target) return true;
    const cleanTarget = target.trim().toLowerCase();
    if (cleanTarget === 'xp' || cleanTarget === 'total') return true;

    // Check Attributes
    const allAttributes = Object.values(rules.definitions.attributes || {}).flat();
    if (allAttributes.some(a => a.toLowerCase() === cleanTarget)) return true;

    // Check Secondary
    const secondaryAttributes = Object.values(rules.definitions.secondaryAttributes || {}).flat();
    if (secondaryAttributes.some(a => a.toLowerCase() === cleanTarget)) return true;

    // Check Counters
    const allCounters = Object.values(rules.definitions.counters || {}).map(c => c.name);
    if (allCounters.some(c => c.toLowerCase() === cleanTarget)) return true;

    // Check Skills
    const allSkills = Object.values(rules.definitions.skills || {}).flat();
    if (allSkills.some(s => s.toLowerCase() === cleanTarget)) return true;

    const allLibSkills = rules.libraries.skills?.map(s => s.name) || [];
    if (allLibSkills.some(s => s.toLowerCase() === cleanTarget)) return true;

    return false;
};
