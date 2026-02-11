import { CharacterSheetData, DotEntry } from '../types';

/**
 * Accès typé aux skills par catégorie dynamique
 */
export function getSkillCategory(
    state: CharacterSheetData,
    categoryId: string
): DotEntry[] {
    return (state.skills as Record<string, DotEntry[]>)[categoryId] || [];
}

/**
 * Mutation typée d'une catégorie de skills
 */
export function setSkillCategory(
    state: CharacterSheetData,
    categoryId: string,
    entries: DotEntry[]
): void {
    (state.skills as Record<string, DotEntry[]>)[categoryId] = entries;
}

/**
 * Accès typé aux counters par clé dynamique
 */
export function getCounter(
    state: CharacterSheetData,
    key: string
): any {
    return (state.counters as Record<string, any>)[key];
}

/**
 * Mutation typée d'un counter
 */
export function setCounter(
    state: CharacterSheetData,
    key: string,
    value: any
): void {
    (state.counters as Record<string, any>)[key] = value;
}
