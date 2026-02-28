import { CharacterSheetData } from '../../types';
import { normalizeString } from '../stringUtils';

/**
 * Migration V6: Restaure les liens mysticAbilityId qui ont pu être perdus 
 * lors de la réconciliation trop agressive avec les règles officielles.
 */
export const restoreMysticLinks = (data: CharacterSheetData): void => {
    if (!data.mysticAbilities || !Array.isArray(data.mysticAbilities)) return;

    const abilityMap = new Map<string, string>();
    data.mysticAbilities.forEach(ability => {
        if (ability.name && ability.id) {
            abilityMap.set(normalizeString(ability.name), ability.id);
        }
    });

    // 1. Réparer la skillLibrary
    if (data.skillLibrary && Array.isArray(data.skillLibrary)) {
        data.skillLibrary.forEach(skill => {
            const normalized = normalizeString(skill.name);
            if (abilityMap.has(normalized) && !skill.mysticAbilityId) {
                skill.mysticAbilityId = abilityMap.get(normalized);
            }
        });
    }

    // 2. Réparer les Avantages (Traits)
    if (data.page2?.avantages && Array.isArray(data.page2.avantages)) {
        data.page2.avantages.forEach(trait => {
            const normalized = normalizeString(trait.name);
            if (abilityMap.has(normalized) && !trait.mysticAbilityId) {
                trait.mysticAbilityId = abilityMap.get(normalized);
                // S'assurer que le tag Mystique est présent
                if (!trait.tag || trait.tag === '') {
                    trait.tag = 'Mystique';
                }
            }
        });
    }

    // 3. Réparer les Désavantages (peu probable mais par sécurité)
    if (data.page2?.desavantages && Array.isArray(data.page2.desavantages)) {
        data.page2.desavantages.forEach(trait => {
            const normalized = normalizeString(trait.name);
            if (abilityMap.has(normalized) && !trait.mysticAbilityId) {
                trait.mysticAbilityId = abilityMap.get(normalized);
            }
        });
    }
};
