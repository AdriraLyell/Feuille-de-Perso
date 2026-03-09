import { useMemo, useRef, useDeferredValue } from 'react';
import { TraitEntry, LibraryEntry, BonusInfo } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { logger } from '../utils/logger';
import { evaluateFormula } from '../utils/formulaEvaluator';
import { useCharacterState } from '../context/CharacterContext';
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
    const { data: characterData } = useCharacterState();
    const deferredData = useDeferredValue(characterData);
    const { rules } = useRules();

    const calculated = useMemo(() => {
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
                    let effectiveTarget = effect.target;
                    let effectiveType: string = effect.type;

                    if (effect.formulaId && rules?.libraries?.formulas) {
                        const globalFormula = rules.libraries.formulas.find(f => f.id === effect.formulaId);
                        if (globalFormula) {
                            formulaString = globalFormula.formula || effect.formula;
                            if (globalFormula.type === 'variable') {
                                isReserve = true;
                                activeReserves.add(globalFormula.id);
                            }

                            // AUTO-PORTANTE: Heirarchical Target and EffectType
                            if (globalFormula.forceVariant && !effect.target) {
                                // If it forces a variant, the trait's variant is our target
                                effectiveTarget = trait.variant;
                            } else if (!effectiveTarget && globalFormula.target) {
                                effectiveTarget = globalFormula.target;
                            }
                            if (globalFormula.effectType) {
                                effectiveType = globalFormula.effectType;
                            }
                        }
                    }

                    // Skill Blocking
                    if (effectiveType === 'block_skill_increase' && effectiveTarget) {
                        const targetName = normalizeString(effectiveTarget);
                        blockedSkills[targetName] = {
                            isBlocked: true,
                            sourceName: trait.name
                        };
                    }

                    // Formula Evaluation
                    const isFormulaLike = effectiveType === 'formula' || effectiveType === 'xp_bonus';
                    if (isFormulaLike && formulaString && deferredData) {
                        // Skip evaluation for raw reserves (they don't target/modify existing stats, they ARE stats)
                        if (isReserve) return;

                        const targetName = normalizeString(effectiveTarget || "");
                        if (!targetName) return;

                        const traitValue = parseInt(trait.value?.toString() || '1') || 1;

                        try {
                            const result = evaluateFormula(formulaString, {
                                ...deferredData,
                                formulaLibrary: rules?.libraries?.formulas || deferredData.formulaLibrary
                            }, { traitLevel: traitValue });

                            // Handle special semantic effects even for formulas
                            if (effectiveType === 'xp_bonus' || targetName === 'xp') {
                                // XP handled elsewhere (but we could record it here if needed)
                                return;
                            }

                            const isAttribute = Object.keys(deferredData.attributes).some(
                                cat => deferredData.attributes[cat].some(attr => normalizeString(attr.name) === targetName)
                            );

                            const operator = effect.operator || (rules?.libraries?.formulas?.find(f => f.id === effect.formulaId)?.operator) || 'ADD';

                            if (isAttribute) {
                                if (!attributeBonuses[targetName]) {
                                    attributeBonuses[targetName] = { value: 0, sources: [] };
                                }
                                if (operator === 'ADD') {
                                    attributeBonuses[targetName].value += result;
                                } else if (operator === 'SUB') {
                                    attributeBonuses[targetName].value -= result;
                                } else if (operator === 'SET') {
                                    attributeBonuses[targetName].value = result;
                                }
                                attributeBonuses[targetName].sources.push(`${trait.name} (${operator === 'SUB' ? '-' : operator === 'SET' ? '=' : '+'}${result})`);
                            } else if ((effectiveType as string) === 'master_skill' || (effectiveType as string) === 'block_skill_increase') {
                                // These are handled by their own logic blocks usually
                            } else {
                                // Assume it's a counter
                                if (trait.isPostCreation) {
                                    if (operator === 'SET') counterXPBonuses[targetName] = result;
                                    else if (operator === 'SUB') counterXPBonuses[targetName] = (counterXPBonuses[targetName] || 0) - result;
                                    else counterXPBonuses[targetName] = (counterXPBonuses[targetName] || 0) + result;
                                } else {
                                    if (operator === 'SET') counterCreationBonuses[targetName] = result;
                                    else if (operator === 'SUB') counterCreationBonuses[targetName] = (counterCreationBonuses[targetName] || 0) - result;
                                    else counterCreationBonuses[targetName] = (counterCreationBonuses[targetName] || 0) + result;
                                }
                            }

                        } catch (e) {
                            logger.error(`Error evaluating formula for trait ${trait.name}: `, e);
                        }
                    }
                });
            }
        });
        // Calculate Dynamic Maxes for Counters
        if (deferredData && rules?.libraries?.counters) {
            Object.values(deferredData.skills || {}).flat().forEach(skill => {
                // We only care about skills that are actually "Counters" 
                // (This is determined by their category behavior, but checking library here is more direct)
                const counterLibEntry = rules.libraries.counters.find(c => c.name === skill.name);
                if (counterLibEntry?.formulaId) {
                    const formulaEntry = rules.libraries.formulas?.find(f => f.id === counterLibEntry.formulaId);
                    if (formulaEntry) {
                        try {
                            const maxVal = evaluateFormula(formulaEntry.formula, {
                                ...deferredData,
                                formulaLibrary: rules.libraries.formulas
                            });
                            calculatedMaxes[skill.name] = maxVal;
                        } catch (e) {
                            logger.error(`Error calculating dynamic max for counter ${skill.name}: `, e);
                        }
                    }
                }
            });

            // Handle Standard Counters (those in data.counters)
            if (deferredData.counters) {
                const processCounter = (counter: import('../types').DotEntry) => {
                    if (!counter || !counter.name) return;
                    const nameKey = normalizeString(counter.name);
                    const libEntry = rules.libraries.counters.find(c => normalizeString(c.name) === nameKey);

                    if (libEntry?.formulaId) {
                        const formulaEntry = rules.libraries.formulas?.find(f => f.id === libEntry.formulaId);
                        if (formulaEntry) {
                            try {
                                const maxVal = evaluateFormula(formulaEntry.formula, {
                                    ...deferredData,
                                    formulaLibrary: rules.libraries.formulas
                                });
                                calculatedMaxes[counter.name] = maxVal;
                            } catch (e) {
                                logger.error(`Error calculating dynamic max for counter ${counter.name}: `, e);
                            }
                        }
                    } else if (libEntry?.formula) {
                        try {
                            const maxVal = evaluateFormula(libEntry.formula, {
                                ...deferredData,
                                formulaLibrary: rules.libraries.formulas
                            });
                            calculatedMaxes[counter.name] = maxVal;
                        } catch (e) {
                            logger.error(`Error calculating dynamic max for counter ${counter.name}: `, e);
                        }
                    }
                };

                Object.keys(deferredData.counters).forEach(key => {
                    const value = deferredData.counters[key as keyof typeof deferredData.counters];
                    if (Array.isArray(value)) {
                        value.forEach(processCounter);
                    } else {
                        processCounter(value as import('../types').DotEntry);
                    }
                });
            }
        }

        return { attributeBonuses, blockedSkills, counterCreationBonuses, counterXPBonuses, calculatedMaxes, activeReserves: Array.from(activeReserves) };
    }, [avantages, desavantages, library, rulesTraits, deferredData, rules]);

    // Deep comparison ref to avoid breaking memoization in children
    const prevRef = useRef(calculated);

    return useMemo(() => {
        if (JSON.stringify(prevRef.current) !== JSON.stringify(calculated)) {
            prevRef.current = calculated;
        }
        return prevRef.current;
    }, [calculated]);
};
