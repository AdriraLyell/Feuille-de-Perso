import { CharacterSheetData, DotEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { normalizeString } from '../stringUtils';

/**
 * Synchronizes custom counters with their library definitions.
 * 
 * @param newState - The current draft state
 * @param currentState - The source state
 * @param rules - The campaign rules
 */
export const reconcileCounters = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    if (!rules.definitions.counters) return;

    const newCounters: CharacterSheetData['counters'] = {
        custom: currentState.counters.custom || []
    };

    Object.keys(rules.definitions.counters).forEach(key => {
        const def = rules.definitions.counters[key];
        const existingRaw = currentState.counters[key];
        const existing = Array.isArray(existingRaw) ? existingRaw[0] : (existingRaw as DotEntry | undefined);

        const libCounter = rules.libraries?.counters?.find(c => normalizeString(c.name) === normalizeString(def.name) || c.id === key);
        const description = def.description || libCounter?.description || '';

        const defaultValue = def.defaultValue !== undefined ? def.defaultValue : (def.value || 3);
        const max = def.max || 10;

        const value = existing?.value !== undefined ? existing.value : defaultValue;
        const creationValue = existing?.creationValue !== undefined ? existing.creationValue : defaultValue;

        if (existing) {
            newCounters[key] = {
                ...existing,
                name: def.name,
                max,
                description: description || existing.description || '',
                value,
                creationValue
            };
        } else {
            newCounters[key] = {
                id: key,
                name: def.name,
                description,
                value,
                creationValue,
                max,
                current: 0
            };
        }
    });
    newState.counters = newCounters;
};
