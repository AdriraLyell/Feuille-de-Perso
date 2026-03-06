import { CharacterSheetData, DotEntry } from '../../types';
import { RulesData } from '../../types/rules';

/**
 * Synchronizes custom counters with their library definitions.
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

        const defaultValue = def.defaultValue !== undefined ? def.defaultValue : (def.value || 3);
        const max = def.max || 10;

        const value = existing?.value !== undefined ? existing.value : defaultValue;
        const creationValue = existing?.creationValue !== undefined ? existing.creationValue : defaultValue;

        if (existing) {
            newCounters[key] = {
                ...existing,
                name: def.name,
                max,
                value,
                creationValue
            };
        } else {
            newCounters[key] = {
                id: key,
                name: def.name,
                value,
                creationValue,
                max,
                current: 0
            };
        }
    });
    newState.counters = newCounters;
};
