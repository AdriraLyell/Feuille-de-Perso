import { useMemo } from 'react';
import { TraitEntry, LibraryEntry, BonusInfo } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { logger } from '../utils/logger';
import { evaluateFormula } from '../utils/formulaEvaluator';
import { useCharacter } from '../context/CharacterContext';
import { useRules } from '../context/RulesContext';

/**
 * Hook chirurgical pour extraire la logique de calcul des bonus d'attributs.
 */
export const useCharacterBonuses = (
    avantages: TraitEntry[] = [],
    desavantages: TraitEntry[] = [],
    library: LibraryEntry[] = [],
    rulesTraits: LibraryEntry[] = []
) => {
    const { data: characterData } = useCharacter();
    const { rules } = useRules();

    return useMemo(() => {
        const attributeBonuses: Record<string, BonusInfo> = {};
        const blockedSkills: Record<string, { isBlocked: boolean, sourceName: string }> = {};
        const counterCreationBonuses: Record<string, number> = {};
        const counterXPBonuses: Record<string, number> = {};
        const activeReserves: Set<string> = new Set();
        const allTraits = [...(avantages || []), ...(desavantages || [])];

        allTraits.forEach(trait => {
            if (!trait.name) return;
            const normalizedTraitName = normalizeString(trait.name);
            const libEntry = library?.find(l => normalizeString(l.name) === normalizedTraitName) ||
                rulesTraits?.find(t => normalizeString(t.name) === normalizedTraitName);

            if (libEntry && libEntry.effects) {
                libEntry.effects.forEach(effect => {
                    // Try to resolve formula from global library if formulaId is present
                    let formulaString = effect.formula;
                    let isReserve = false;

                    if (effect.formulaId && rules?.libraries?.formulas) {
                        const globalFormula = rules.libraries.formulas.find(f => f.id === effect.formulaId);
                        if (globalFormula) {
                            formulaString = globalFormula.formula;
                            if (globalFormula.type === 'reserve') {
                                isReserve = true;
                                activeReserves.add(globalFormula.id);
                            }
                        }
                    }

                    // Skill Blocking
                    if (effect.type === 'block_skill_increase' && effect.target) {
                        const targetName = normalizeString(effect.target);
                        blockedSkills[targetName] = {
                            isBlocked: true,
                            sourceName: trait.name
                        };
                    }

                    // Formula Evaluation
                    if (effect.type === 'formula' && formulaString && characterData) {
                        // Skip evaluation for raw reserves (they don't target/modify existing stats, they ARE stats)
                        if (isReserve) return;

                        const targetName = normalizeString(effect.target || "");
                        if (!targetName) return;

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
                            const result = evaluateFormula(formulaString, localDataForEval);

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
        return { attributeBonuses, blockedSkills, counterCreationBonuses, counterXPBonuses, activeReserves: Array.from(activeReserves) };
    }, [avantages, desavantages, library, rulesTraits, characterData, rules]);
};
