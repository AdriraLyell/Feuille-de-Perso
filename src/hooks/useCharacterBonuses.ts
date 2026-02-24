import { useMemo } from 'react';
import { TraitEntry, LibraryEntry, BonusInfo } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { logger } from '../utils/logger';

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
        const counterCreationBonuses: Record<string, number> = {};
        const counterXPBonuses: Record<string, number> = {};
        const allTraits = [...(avantages || []), ...(desavantages || [])];

        allTraits.forEach(trait => {
            if (!trait.name) return;
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

                    // Counter Bonuses
                    if (effect.type === 'counter_max_bonus' && effect.target) {
                        const targetName = normalizeString(effect.target);
                        const traitValue = parseInt(trait.value?.toString() || '1') || 1;
                        const totalBonus = effect.value * traitValue;

                        if (trait.isPostCreation) {
                            counterXPBonuses[targetName] = (counterXPBonuses[targetName] || 0) + totalBonus;
                        } else {
                            counterCreationBonuses[targetName] = (counterCreationBonuses[targetName] || 0) + totalBonus;
                        }
                    }
                });
            }
        });
        return { attributeBonuses, blockedSkills, counterCreationBonuses, counterXPBonuses };
    }, [avantages, desavantages, library, rulesTraits]);
};
