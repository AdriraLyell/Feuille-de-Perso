import { CharacterSheetData, TraitEntry } from '../../types';
import { RulesData, BONUS_MJ_TRAIT_ID } from '../../types/rules';
import { normalizeString } from '../stringUtils';

/**
 * Links traits (advantages/disadvantages) to their latest library definitions.
 * Simplified for Phase 2: Descriptive metadata is resolved at runtime.
 */
export const reconcileTraits = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    const processTraitList = (list: TraitEntry[], type: 'avantage' | 'desavantage'): TraitEntry[] => {
        if (!list) return [];
        return list.map(existing => {
            const normalizedName = normalizeString(existing.name);
            const libMatch = existing.definitionId
                ? rules.libraries?.traits?.find(t => t.id === existing.definitionId)
                : rules.libraries?.traits?.find(t =>
                    t.type === type && normalizeString(t.name) === normalizedName
                );

            if (libMatch) {
                return {
                    ...existing,
                    name: libMatch.name, // Official casing
                    definitionId: libMatch.id,
                    type: (libMatch.type as 'avantage' | 'desavantage') || existing.type,
                    // REMOVED: description, tag, hasAutoCounter, etc. (handled by resolution)
                };
            }

            return existing;
        });
    };

    if (newState.page2) {
        newState.page2.avantages = processTraitList(currentState.page2.avantages || [], 'avantage');
        newState.page2.desavantages = processTraitList(currentState.page2.desavantages || [], 'desavantage');

        // --- Bonus MJ Auto-Injection ---
        const bonusValue = rules.configurations?.creation?.bonusMJ ?? 0;
        const desavantages = [...(newState.page2.desavantages || [])];
        const existingIdx = desavantages.findIndex(t => t.definitionId === BONUS_MJ_TRAIT_ID);

        if (bonusValue > 0) {
            const libTrait = rules.libraries?.traits?.find(t => t.id === BONUS_MJ_TRAIT_ID);
            if (libTrait) {
                const traitData: TraitEntry = {
                    definitionId: BONUS_MJ_TRAIT_ID,
                    name: libTrait.name,
                    value: String(bonusValue),
                    creationValue: String(bonusValue),
                    type: 'desavantage'
                };

                if (existingIdx === -1) {
                    // Find first empty slot
                    const emptyIdx = desavantages.findIndex(t => !t.name.trim());
                    if (emptyIdx !== -1) {
                        desavantages[emptyIdx] = traitData;
                    } else {
                        desavantages.push(traitData);
                    }
                } else {
                    // Synchronize value
                    desavantages[existingIdx] = {
                        ...desavantages[existingIdx],
                        name: libTrait.name,
                        value: String(bonusValue),
                        creationValue: String(bonusValue)
                    };
                }
            }
        } else if (existingIdx !== -1) {
            // Remove if budget is 0
            desavantages.splice(existingIdx, 1);
        }
        newState.page2.desavantages = desavantages;
    }
}

/**
 * Cleanup function.
 * Phase 2: We no longer store libraries in CharacterSheetData.
 * This function now only ensures that the character state is sane.
 */
export const reconcileCleanup = (newState: CharacterSheetData, currentState: CharacterSheetData, _rules: RulesData) => {
    // We can clear the libraries from the character state as they are now optional 
    // and resolved from RulesContext at runtime.
    newState.library = [];
    newState.skillLibrary = [];
    newState.specializationLibrary = [];
    newState.backgroundLibrary = [];
    newState.counterLibrary = [];
    newState.mysticAbilities = [];

    // Ensure basic structures exist
    if (!newState.skills) newState.skills = {};
    if (!newState.counters) newState.counters = { custom: [] };
    if (!newState.page2) newState.page2 = currentState.page2 || {};
};
