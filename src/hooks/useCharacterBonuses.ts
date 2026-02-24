import { useMemo } from 'react';
import { TraitEntry, LibraryEntry, BonusInfo } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { logger } from '../utils/logger';
import { evaluateFormula } from '../utils/formulaEvaluator';
import { useCharacter } from '../context/CharacterContext';

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
    const { data: characterData } = useCharacter();

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
                    // Attribute Bonuses - OBSOLETE (Now handled by 'formula')

                    // Skill Blocking
                    if (effect.type === 'block_skill_increase' && effect.target) {
                        const targetName = normalizeString(effect.target);
                        blockedSkills[targetName] = {
                            isBlocked: true,
                            sourceName: trait.name
                        };
                    }

                    // Counter Bonuses - OBSOLETE (Now handled by 'formula')
                    if (effect.type === 'formula' && effect.target && effect.formula && characterData) {
                        const targetName = normalizeString(effect.target);
                        const traitValue = parseInt(trait.value?.toString() || '1') || 1;

                        // Define TRAIT_LEVEL variable for the formula
                        const localDataForEval = {
                            ...characterData,
                            variables: {
                                ...(characterData.variables || {}),
                                TRAIT_LEVEL: traitValue
                            }
                        };

                        try {
                            const result = evaluateFormula(effect.formula, localDataForEval);

                            // Ignore formulas targeting XP (Handled by xpCalculator)
                            if (targetName === 'xp') return;

                            const isAttribute = Object.keys(characterData.attributes).some(
                                cat => characterData.attributes[cat].some(attr => normalizeString(attr.name) === targetName)
                            );

                            if (isAttribute) {
                                if (!attributeBonuses[targetName]) {
                                    attributeBonuses[targetName] = { value: 0, sources: [] };
                                }
                                attributeBonuses[targetName].value += result;
                                attributeBonuses[targetName].sources.push(`${trait.name} (Formule: ${result > 0 ? '+' : ''}${result})`);
                            } else {
                                // Assume it's a counter
                                if (trait.isPostCreation) {
                                    counterXPBonuses[targetName] = (counterXPBonuses[targetName] || 0) + result;
                                } else {
                                    counterCreationBonuses[targetName] = (counterCreationBonuses[targetName] || 0) + result;
                                }
                            }

                        } catch (e) {
                            logger.error(`Error evaluating formula for trait ${trait.name}:`, e);
                        }
                    }
                });
            }
        });
        return { attributeBonuses, blockedSkills, counterCreationBonuses, counterXPBonuses };
    }, [avantages, desavantages, library, rulesTraits, characterData]);
};
