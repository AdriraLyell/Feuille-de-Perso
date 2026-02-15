import {
    CharacterSheetData,
    ExperienceData,
    TraitEffect,
    DotEntry,
    RulesData
} from '../../types';
import { normalizeString } from '../stringUtils';

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
    const activeEffects = getActiveTraitEffects(data);

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

    const traitXPBonus = activeEffects
        .filter(e => e.type === 'xp_bonus')
        .reduce((sum, e) => sum + e.value, 0);

    // 2. Calcul de l'XP dépensée
    let totalSpent = 0;
    const handledCounters = new Set<string>();

    // A. Calcul des Compétences (Dynamique ou Legacy)
    totalSpent += calculateSkillXP(data, rules, getFreeRankLimit, handledCounters);

    // B. Compteurs (traitement des compteurs restant)
    totalSpent += calculateCounterXP(data, rules, handledCounters);

    // C. Attributs (Coût Linéaire)
    totalSpent += calculateAttributeXP(data, getAttributeBonus);

    // 3. Calcul du bilan final
    const gainFromLogs = (data.xpLogs || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const totalGain = gainFromLogs + traitXPBonus;

    return {
        gain: traitXPBonus > 0 ? `${gainFromLogs} (+${traitXPBonus})` : gainFromLogs.toString(),
        spent: totalSpent.toString(),
        rest: (totalGain - totalSpent).toString()
    };
};

/**
 * Extrait tous les effets de traits actifs du personnage
 */
function getActiveTraitEffects(data: CharacterSheetData): TraitEffect[] {
    const activeEffects: TraitEffect[] = [];
    const findEffects = (traitName: string) => {
        if (!traitName) return;
        const entry = data.library?.find(l => l.name.trim().toLowerCase() === traitName.trim().toLowerCase());
        if (entry && entry.effects) {
            entry.effects.forEach(e => activeEffects.push(e));
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
): number {
    let skillSpent = 0;
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

                    const baseCost = libDef?.xpCost !== undefined ? libDef.xpCost : (sysDef?.xpCost ?? 5);
                    const freeBase = libDef?.defaultValue !== undefined ? libDef.defaultValue : (sysDef?.defaultValue ?? 0);
                    const effectiveBase = Math.max(skill.creationValue || 0, freeBase);

                    baseFactor = baseCost * multiplier;
                    handledCounters.add(skill.id);
                    skillSpent += getXPCost(skill.value, effectiveBase, baseFactor, false);
                } else {
                    skillSpent += getXPCost(skill.value, effectiveCreationValue, baseFactor, isTriangular);
                }
            });
        });
    } else {
        // Fallback Legacy
        const skillFactor = data.xpCosts?.skillFactor ?? 1.0;
        const specFactor = data.xpCosts?.specializationFactor ?? 0.5;
        const bgCostBase = data.creationConfig?.backgroundCost ?? 2;

        const standardCategories = ['talents', 'competences', 'competences_col_2', 'connaissances', 'autres_competences', 'autres', 'Col_Comp_1', 'Col_Comp_2', 'Col_Comp_3', 'Col_Comp_4', 'Col_Comp_5', 'Col_Comp_7'];
        standardCategories.forEach(key => {
            const list = data.skills[key];
            if (Array.isArray(list)) {
                list.forEach(skill => {
                    const freeLimit = getFreeRankLimit(skill.name);
                    const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                    skillSpent += getXPCost(skill.value, effectiveCreationValue, skillFactor, true);
                });
            }
        });

        const secondSkills = data.skills.competences2 || data.skills.Col_Comp_6;
        if (Array.isArray(secondSkills)) {
            secondSkills.forEach(skill => {
                const freeLimit = getFreeRankLimit(skill.name);
                const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                skillSpent += getXPCost(skill.value, effectiveCreationValue, specFactor, true);
            });
        }

        const backgroundSkills = data.skills.arrieres_plans || data.skills.Col_Comp_8;
        if (Array.isArray(backgroundSkills)) {
            backgroundSkills.forEach(skill => {
                skillSpent += getXPCost(skill.value, skill.creationValue || 0, bgCostBase, false);
            });
        }
    }
    return skillSpent;
}

/**
 * Calcule l'XP dépensée dans les compteurs restants
 */
function calculateCounterXP(
    data: CharacterSheetData,
    rules: RulesData | undefined,
    handledCounters: Set<string>
): number {
    let counterSpent = 0;
    if (!data.counters) return 0;

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

        const xpCost = libDef?.xpCost !== undefined ? libDef.xpCost : (sysDef?.xpCost ?? 0);

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
            counterSpent += getXPCost(counterEntry.value, counterEntry.creationValue || 0, xpCost * multiplier, false);
        }
    });

    if (data.counters.custom && Array.isArray(data.counters.custom)) {
        data.counters.custom.forEach(counter => {
            if (handledCounters.has(counter.id)) return;
            const libDef = libCounters.find(c => c.id === counter.id)
                || libCounters.find(c => normalizeString(c.name) === normalizeString(counter.name));
            const sysDef = Object.values(rulesCounters).find(c => c.name === counter.name);

            const xpCost = libDef?.xpCost !== undefined ? libDef.xpCost : (sysDef?.xpCost ?? 0);

            if (xpCost > 0) {
                const modelDefault = libDef?.defaultValue ?? (sysDef?.defaultValue ?? 0);
                const creationValue = Math.max(counter.creationValue || 0, modelDefault);
                counterSpent += getXPCost(counter.value, creationValue, xpCost, false);
            }
        });
    }
    return counterSpent;
}

/**
 * Calcule l'XP dépensée dans les attributs
 */
function calculateAttributeXP(
    data: CharacterSheetData,
    getAttributeBonus: (name: string) => number
): number {
    let attrSpent = 0;
    if (!data.attributeSettings) return 0;

    data.attributeSettings.forEach(cat => {
        const attrs = data.attributes[cat.id];
        const secAttrs = data.secondaryAttributesActive ? data.secondaryAttributes[cat.id] : [];
        const allAttrs = [...(attrs || []), ...(secAttrs || [])];

        if (allAttrs) {
            allAttrs.forEach(attr => {
                const val = parseInt(attr.val1) || 0;
                const bonus = getAttributeBonus(attr.name);
                const effectiveCreation = (attr.creationVal1 || 0) + bonus;
                const costPerPoint = data.xpCosts?.attributeFactor ?? 6;
                attrSpent += getXPCost(val, effectiveCreation, costPerPoint, false);
            });
        }
    });
    return attrSpent;
}
