import { useMemo } from 'react';
import { TraitEntry, LibraryEntry, BonusInfo } from '../types';
import { normalizeString } from '../utils/stringUtils';

/**
 * Hook chirurgical pour extraire la logique de calcul des bonus d'attributs.
 * Cette logique était auparavant située dans CharacterSheet.tsx.
 */
export const useCharacterBonuses = (
    avantages: TraitEntry[] = [],
    desavantages: TraitEntry[] = [],
    library: LibraryEntry[] = [],
    rulesTraits: LibraryEntry[] = []
) => {
    return useMemo(() => {
        const attributeBonuses: Record<string, BonusInfo> = {};
        const blockedSkills: Record<string, { isBlocked: boolean, sourceName: string }> = {};
        const counterMaxBonuses: Record<string, number> = {};
        const allTraits = [...(avantages || []), ...(desavantages || [])];

        allTraits.forEach(trait => {
            if (!trait.name) return;
            // Find corresponding library entry to get active effects
            // Normalize names for matching
            const normalizedTraitName = normalizeString(trait.name);
            const libEntry = library?.find(l => normalizeString(l.name) === normalizedTraitName) ||
                rulesTraits?.find(t => normalizeString(t.name) === normalizedTraitName);

            if (libEntry && libEntry.effects) {
                libEntry.effects.forEach(effect => {
                    // Attribute Bonuses
                    if (effect.type === 'attribute_bonus' && effect.target) {
                        const targetName = normalizeString(effect.target);
                        if (!attributeBonuses[targetName]) {
                            attributeBonuses[targetName] = { value: 0, sources: [] };
                        }
                        attributeBonuses[targetName].value += effect.value;
                        attributeBonuses[targetName].sources.push(`${trait.name} (${effect.value > 0 ? '+' : ''}${effect.value})`);
                    }

                    // Skill Blocking
                    if (effect.type === 'block_skill_increase' && effect.target) {
                        const targetName = normalizeString(effect.target);
                        blockedSkills[targetName] = {
                            isBlocked: true,
                            sourceName: trait.name
                        };
                    }

                    // Counter Max Bonuses
                    if (effect.type === 'counter_max_bonus' && effect.target) {
                        const targetName = normalizeString(effect.target);
                        counterMaxBonuses[targetName] = (counterMaxBonuses[targetName] || 0) + effect.value;
                    }
                });
            }
        });
        return { attributeBonuses, blockedSkills, counterMaxBonuses };
    }, [avantages, desavantages, library, rulesTraits]);
};
