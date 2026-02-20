import {
    CharacterSheetData,
    ExperienceData,
    ExperienceBreakdownItem,
    TraitEffect,
    DotEntry,
    RulesData
} from '../../types';
import { normalizeString } from '../stringUtils';
import { logger } from '../logger';

/**
 * Calcule la somme triangulaire : n + (n-1) + ... + 1
 */
export const triangular = (n: number): number => {
    return (n * (n + 1)) / 2;
};

/**
 * Calcule le coût en XP pour passer d'un niveau de création à un niveau actuel
 */
export const getXPCost = (currentValue: number, creationValue: number = 0, factor: number = 1.0, useTriangular: boolean = true): number => {
    if (currentValue === 0 || currentValue <= creationValue) return 0;

    if (useTriangular) {
        const baseCost = triangular(currentValue) - triangular(creationValue);
        return baseCost * factor;
    } else {
        // Coût linéaire
        const diff = Math.max(0, currentValue - creationValue);
        return diff * factor;
    }
};

/**
 * Calcule le bilan d'XP complet pour un personnage
 */
export const calculateExperienceResults = (data: CharacterSheetData, rules?: RulesData): ExperienceData => {
    // 0. Extraction des effets actifs des traits
    const activeEffects = getActiveTraitEffects(data, rules);

    // 1. Helpers pour les bonus
    const getFreeRankLimit = (skillName: string) => {
        const effect = activeEffects.find(e =>
            e.type === 'free_skill_rank' &&
            e.target &&
            skillName.trim().toLowerCase() === e.target.trim().toLowerCase()
        );
        return effect ? effect.value : 0;
    };

    const getAttributeBonus = (attrName: string) => {
        const effect = activeEffects.find(e =>
            e.type === 'attribute_bonus' &&
            e.target &&
            attrName.trim().toLowerCase() === e.target.trim().toLowerCase()
        );
        return effect ? effect.value : 0;
    };

    // Calcul des bonus XP (Fixe vs Par Scénario)
    const xpEffects = activeEffects.filter(e => e.type === 'xp_bonus');

    // Bonus Fixes
    const fixedBonusBreakdown: ExperienceBreakdownItem[] = xpEffects
        .filter(e => !e.method || e.method === 'fixed' && e.value !== 0)
        .map(e => ({ name: `Bonus : ${e.source || 'Trait'}`, amount: e.value }));

    const fixedBonus = fixedBonusBreakdown.reduce((sum, e) => sum + e.amount, 0);

    // Bonus par Scénario
    const scenarioLogs = (data.xpLogs || []).filter(log =>
        log.countsAsScenario !== undefined
            ? log.countsAsScenario
            : (log.amount > 0 || (log.scenario && log.scenario.trim() !== ''))
    );
    const scenarioCount = scenarioLogs.length;

    const scenarioBonusBreakdown: ExperienceBreakdownItem[] = xpEffects
        .filter(e => e.method === 'per_scenario' && e.value !== 0)
        .map(e => ({
            name: `Bonus : ${e.source || 'Apprentissage'} (${scenarioCount} sessions)`,
            amount: e.value * scenarioCount
        }));

    const perScenarioBonus = scenarioBonusBreakdown.reduce((sum, e) => sum + e.amount, 0);

    const totalTraitXP = fixedBonus + perScenarioBonus;

    // Gains de base (Log)
    const baseGainsBreakdown: ExperienceBreakdownItem[] = (data.xpLogs || [])
        .filter(entry => entry.amount !== 0)
        .map(entry => ({
            name: entry.scenario || (entry.date ? `Session ${entry.date}` : 'Gain divers'),
            amount: entry.amount
        }));

    const gainFromLogs = baseGainsBreakdown.reduce((sum, e) => sum + e.amount, 0);
    const totalGain = gainFromLogs + totalTraitXP;

    // 2. Calcul de l'XP dépensée
    const handledCounters = new Set<string>();

    const skillResult = calculateSkillXP(data, rules, getFreeRankLimit, handledCounters);
    const counterResult = calculateCounterXP(data, rules, handledCounters);
    const attributeResult = calculateAttributeXP(data);
    const traitResult = calculateTraitXP(data, rules);

    const totalSpent = skillResult.total + counterResult.total + attributeResult.total + traitResult.total;

    // 3. Construction du bilan final
    let gainDisplay = totalGain.toString();
    let tooltip = `Total : ${totalGain} XP\n\nBase (Historique) : ${gainFromLogs}`;

    if (totalTraitXP > 0) {
        gainDisplay += ` (+${totalTraitXP})`;
        if (fixedBonus > 0) tooltip += `\nBonus Fixe : +${fixedBonus}`;
        if (perScenarioBonus > 0) tooltip += `\nBonus Scénarios (${scenarioCount} sessions) : +${perScenarioBonus}`;
    }

    return {
        gain: gainDisplay,
        gainTooltip: tooltip,
        spent: totalSpent.toString(),
        rest: (totalGain - totalSpent).toString(),
        breakdown: {
            gains: [...baseGainsBreakdown, ...fixedBonusBreakdown, ...scenarioBonusBreakdown],
            attributes: attributeResult.breakdown,
            skills: skillResult.breakdown,
            traits: traitResult.breakdown,
            counters: counterResult.breakdown
        }
    };
};

/**
 * Extrait tous les effets de traits actifs du personnage
 * Recherche d'abord dans la bibliothèque locale, puis dans les règles globales
 */
function getActiveTraitEffects(data: CharacterSheetData, rules?: RulesData): TraitEffect[] {
    const activeEffects: TraitEffect[] = [];

    // Indexation pour éviter les O(N²)
    const globalTraits = rules?.libraries?.traits || [];
    const globalTraitMap = new Map(globalTraits.map(t => [normalizeString(t.name), t]));

    const findEffects = (traitName: string) => {
        if (!traitName) return;
        const normalizedName = normalizeString(traitName);

        // 1. Recherche Local
        const localEntry = data.library?.find(l => normalizeString(l.name) === normalizedName);
        if (localEntry && localEntry.effects && localEntry.effects.length > 0) {
            localEntry.effects.forEach(e => activeEffects.push({ ...e, source: localEntry.name }));
            return;
        }

        // 2. Recherche Global (si pas trouvé en local ou pas d'effets en local)
        const globalEntry = globalTraitMap.get(normalizedName);
        if (globalEntry && globalEntry.effects && globalEntry.effects.length > 0) {
            // Log pour debug
            // logger.log(`[xpCalculator] Using global effects for trait "${traitName}"`);
            globalEntry.effects.forEach(e => activeEffects.push({ ...e, source: globalEntry.name }));
        }
    };

    data.page2?.avantages?.forEach(t => findEffects(t.name));
    data.page2?.desavantages?.forEach(t => findEffects(t.name));
    return activeEffects;
}

/**
 * Calcule l'XP dépensée dans les compétences
 */
function calculateSkillXP(
    data: CharacterSheetData,
    rules: RulesData | undefined,
    getFreeRankLimit: (name: string) => number,
    handledCounters: Set<string>
): { total: number, breakdown: ExperienceBreakdownItem[] } {
    let skillSpent = 0;
    const breakdown: ExperienceBreakdownItem[] = [];
    const categories = rules?.definitions?.skillCategories;

    if (categories && categories.length > 0) {
        categories.forEach(cat => {
            const skillList = data.skills[cat.id];
            if (!Array.isArray(skillList)) return;

            const multiplier = cat.costConfig?.factor ?? 1.0;
            const isTriangular = cat.costConfig?.type === 'triangular';
            const behavior = cat.behavior;

            skillList.forEach(skill => {
                const freeLimit = getFreeRankLimit(skill.name);
                const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);

                let baseFactor = multiplier;
                let cost = 0;

                if (behavior === 'Arrière-plan') {
                    const baseCost = data.creationConfig?.backgroundCost ?? 2;
                    baseFactor = baseCost * multiplier;
                }

                if (behavior === 'Compteur') {
                    const rulesCounters = rules?.definitions?.counters || {};
                    const libCounters = rules?.libraries?.counters || [];
                    const sysDef = rulesCounters[skill.id];
                    const displayName = skill.name || sysDef?.name || skill.id;

                    const libDef = libCounters.find(c => c.id === skill.id)
                        || libCounters.find(c => normalizeString(c.name) === normalizeString(displayName));

                    const baseCost = libDef?.xpCost != null ? libDef.xpCost : (sysDef?.xpCost ?? 5);
                    const freeBase = libDef?.defaultValue != null ? libDef.defaultValue : (sysDef?.defaultValue ?? 0);
                    const effectiveBase = Math.max(skill.creationValue || 0, freeBase);

                    baseFactor = baseCost * multiplier;
                    handledCounters.add(skill.id);
                    cost = getXPCost(skill.value, effectiveBase, baseFactor, false);
                } else {
                    cost = getXPCost(skill.value, effectiveCreationValue, baseFactor, isTriangular);
                }

                if (cost > 0) {
                    skillSpent += cost;
                    breakdown.push({ name: skill.name || skill.id, amount: -cost, category: cat.label || cat.id });
                }
            });
        });
    } else {
        // Fallback Legacy
        const skillFactor = data.xpCosts?.skillFactor ?? 1.0;
        const specFactor = data.xpCosts?.specializationFactor ?? 0.5;
        const bgCostBase = data.creationConfig?.backgroundCost ?? 2;

        const legacyCategoryNames: Record<string, string> = {
            'talents': 'Talents',
            'competences': 'Compétences Principales',
            'competences_col_2': 'Compétences Secondaires',
            'connaissances': 'Connaissances',
            'autres_competences': 'Autres Compétences',
            'autres': 'Autres',
            'Col_Comp_1': 'Talents',
            'Col_Comp_2': 'Savoir-Faire',
            'Col_Comp_3': 'Connaissances',
            'Col_Comp_4': 'Langues',
            'Col_Comp_5': 'Mêlée & Tir',
            'Col_Comp_7': 'Autres'
        };

        const standardCategories = ['talents', 'competences', 'competences_col_2', 'connaissances', 'autres_competences', 'autres', 'Col_Comp_1', 'Col_Comp_2', 'Col_Comp_3', 'Col_Comp_4', 'Col_Comp_5', 'Col_Comp_7'];
        standardCategories.forEach(key => {
            const list = data.skills[key];
            if (Array.isArray(list)) {
                list.forEach(skill => {
                    const freeLimit = getFreeRankLimit(skill.name);
                    const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                    const cost = getXPCost(skill.value, effectiveCreationValue, skillFactor, true);
                    if (cost > 0) {
                        skillSpent += cost;
                        breakdown.push({ name: skill.name || skill.id, amount: -cost, category: legacyCategoryNames[key] || 'Compétences' });
                    }
                });
            }
        });

        const secondSkills = data.skills.competences2 || data.skills.Col_Comp_6;
        if (Array.isArray(secondSkills)) {
            secondSkills.forEach(skill => {
                const freeLimit = getFreeRankLimit(skill.name);
                const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                const cost = getXPCost(skill.value, effectiveCreationValue, specFactor, true);
                if (cost > 0) {
                    skillSpent += cost;
                    breakdown.push({ name: skill.name || skill.id, amount: -cost, category: 'Spécialisations' });
                }
            });
        }

        const backgroundSkills = data.skills.arrieres_plans || data.skills.Col_Comp_8;
        if (Array.isArray(backgroundSkills)) {
            backgroundSkills.forEach(skill => {
                const cost = getXPCost(skill.value, skill.creationValue || 0, bgCostBase, false);
                if (cost > 0) {
                    skillSpent += cost;
                    breakdown.push({ name: skill.name || skill.id, amount: -cost, category: 'Arrière-Plans' });
                }
            });
        }
    }
    return { total: skillSpent, breakdown };
}

/**
 * Calcule l'XP dépensée dans les compteurs restants
 */
function calculateCounterXP(
    data: CharacterSheetData,
    rules: RulesData | undefined,
    handledCounters: Set<string>
): { total: number, breakdown: ExperienceBreakdownItem[] } {
    let counterSpent = 0;
    const breakdown: ExperienceBreakdownItem[] = [];
    if (!data.counters) return { total: 0, breakdown: [] };

    const rulesCounters = rules?.definitions?.counters || {};
    const libCounters = rules?.libraries?.counters || [];
    const categories = rules?.definitions?.skillCategories;

    Object.keys(data.counters).forEach(key => {
        if (key === 'custom' || handledCounters.has(key)) return;
        const counterEntry = data.counters[key];
        if (Array.isArray(counterEntry)) return;

        const sysDef = rulesCounters[key];
        const displayName = counterEntry.name || sysDef?.name || key;
        const libDef = libCounters.find(c => c.id === key)
            || libCounters.find(c => normalizeString(c.name) === normalizeString(displayName));

        const xpCost = libDef?.xpCost != null ? libDef.xpCost : (sysDef?.xpCost ?? 0);

        if (xpCost > 0) {
            let multiplier = 1.0;
            const catId = Object.keys(data.skills).find(cid => {
                const list = data.skills[cid];
                return Array.isArray(list) && list.some(s => s.id === key);
            });

            if (catId && categories) {
                const cat = categories.find(c => c.id === catId);
                if (cat) multiplier = cat.costConfig?.factor ?? 1.0;
            }
            const cost = getXPCost(counterEntry.value, counterEntry.creationValue || 0, xpCost * multiplier, false);
            if (cost > 0) {
                counterSpent += cost;
                breakdown.push({ name: counterEntry.name, amount: -cost });
            }
        }
    });

    if (data.counters.custom && Array.isArray(data.counters.custom)) {
        data.counters.custom.forEach(counter => {
            if (handledCounters.has(counter.id)) return;
            const libDef = libCounters.find(c => c.id === counter.id)
                || libCounters.find(c => normalizeString(c.name) === normalizeString(counter.name));
            const sysDef = Object.values(rulesCounters).find(c => c.name === counter.name);

            const xpCost = libDef?.xpCost != null ? libDef.xpCost : (sysDef?.xpCost ?? 0);

            if (xpCost > 0) {
                const modelDefault = libDef?.defaultValue != null ? libDef.defaultValue : (sysDef?.defaultValue ?? 0);
                const creationValue = Math.max(counter.creationValue || 0, modelDefault);
                const cost = getXPCost(counter.value, creationValue, xpCost, false);
                if (cost > 0) {
                    counterSpent += cost;
                    breakdown.push({ name: counter.name, amount: -cost });
                }
            }
        });
    }
    return { total: counterSpent, breakdown };
}

/**
 * Calcule l'XP dépensée dans les attributs
 */
function calculateAttributeXP(
    data: CharacterSheetData
): { total: number, breakdown: ExperienceBreakdownItem[] } {
    let attrSpent = 0;
    const breakdown: ExperienceBreakdownItem[] = [];
    if (!data.attributeSettings) return { total: 0, breakdown: [] };

    data.attributeSettings.forEach(cat => {
        const attrs = data.attributes[cat.id];
        const secAttrs = data.secondaryAttributesActive ? data.secondaryAttributes[cat.id] : [];
        const allAttrs = [...(attrs || []), ...(secAttrs || [])];

        if (allAttrs) {
            allAttrs.forEach(attr => {
                // Seul val2 représente les dépenses d'XP (points achetés après création)
                const val2 = parseInt(attr.val2) || 0;
                if (val2 > 0) {
                    const costPerPoint = data.xpCosts?.attributeFactor ?? 6;
                    const cost = val2 * costPerPoint;
                    attrSpent += cost;
                    breakdown.push({ name: attr.name, amount: -cost, count: val2 });
                }
            });
        }
    });
    return { total: attrSpent, breakdown };
}

/**
 * Calcule l'XP dépensée dans les traits (Avantages / Désavantages)
 */
function calculateTraitXP(data: CharacterSheetData, rules: RulesData | undefined): { total: number, breakdown: ExperienceBreakdownItem[] } {
    const traitCostFactor = rules?.configurations?.xpCosts?.traitCost ?? (data.xpCosts?.traitCost ?? 5);
    const breakdown: ExperienceBreakdownItem[] = [];

    if (data.creationConfig?.active) return { total: 0, breakdown: [] };

    let traitSpent = 0;

    // 1. Avantages achetés post-création
    data.page2.avantages?.forEach(trait => {
        if (trait.isPostCreation) {
            const val = parseInt(trait.value) || 0;
            const cost = val * traitCostFactor;
            traitSpent += cost;
            breakdown.push({ name: trait.name, amount: -cost });
        }
    });

    // 2. Désavantages rachetés (réduits) post-création
    data.page2.desavantages?.forEach(trait => {
        if (trait.creationValue !== undefined) {
            const currentVal = parseInt(trait.value) || 0;
            const creationVal = parseInt(trait.creationValue) || 0;
            const diff = Math.max(0, creationVal - currentVal);
            if (diff > 0) {
                const cost = diff * traitCostFactor;
                traitSpent += cost;
                breakdown.push({ name: `Rachat : ${trait.name}`, amount: -cost });
            }
        }
    });

    return { total: traitSpent, breakdown };
}
