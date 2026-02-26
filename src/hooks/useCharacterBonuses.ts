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
        const calculatedMaxes: Record<string, number> = {};
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
                            if (globalFormula.type === 'variable') {
                                isReserve = true;
                                activeReserves.add(globalFormula.id);
                            }

                            // AUTO-PORTANTE: Heirarchical Target and EffectType
                            // If the effect doesn't have a target, use the global formula's target
                            if (!effect.target && globalFormula.target) {
                                effect.target = globalFormula.target;
                            }
                            // If the effect doesn't have a type or is generic 'formula', use global effectType if set
                            if (globalFormula.effectType) {
                                (effect as any).inferredEffectType = globalFormula.effectType;
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

                            const effectiveEffectType = (effect as any).inferredEffectType || effect.type;

                            // Handle special semantic effects even for formulas
                            if (effectiveEffectType === 'xp_bonus' || targetName === 'xp') {
                                // XP handled elsewhere (but we could record it here if needed)
                                return;
                            }

                            const isAttribute = Object.keys(characterData.attributes).some(
                                cat => characterData.attributes[cat].some(attr => normalizeString(attr.name) === targetName)
                            );

                            if (isAttribute) {
                                if (!attributeBonuses[targetName]) {
                                    attributeBonuses[targetName] = { value: 0, sources: [] };
                                }
                                attributeBonuses[targetName].value += result;
                                attributeBonuses[targetName].sources.push(`${trait.name} (Formule: ${result > 0 ? '+' : ''}${result})`);
                            } else if (effectiveEffectType === 'master_skill' || effectiveEffectType === 'block_skill_increase') {
                                // These are handled by their own logic blocks usually, but if they came from a formula,
                                // we might want to register them.
                                // block_skill_increase is already handled above line 53 if it's the static type.
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
        // Calculate Dynamic Maxes for Counters
        if (characterData && rules?.libraries?.counters) {
            Object.values(characterData.skills || {}).flat().forEach(skill => {
                // We only care about skills that are actually "Counters" 
                // (This is determined by their category behavior, but checking library here is more direct)
                const counterLibEntry = rules.libraries.counters.find(c => c.name === skill.name);
                if (counterLibEntry?.formulaId) {
                    const formulaEntry = rules.libraries.formulas?.find(f => f.id === counterLibEntry.formulaId);
                    if (formulaEntry) {
                        try {
                            const maxVal = evaluateFormula(formulaEntry.formula, characterData);
                            calculatedMaxes[skill.name] = maxVal;
                        } catch (e) {
                            logger.error(`Error calculating dynamic max for counter ${skill.name}:`, e);
                        }
                    }
                }
            });
        }

        return { attributeBonuses, blockedSkills, counterCreationBonuses, counterXPBonuses, calculatedMaxes, activeReserves: Array.from(activeReserves) };
    }, [avantages, desavantages, library, rulesTraits, characterData, rules]);
};
