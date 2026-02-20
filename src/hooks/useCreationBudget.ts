import { useMemo } from 'react';
import { useCharacter } from '../context/CharacterContext';
import { useRules } from '../context/RulesContext';
import { DotEntry } from '../types';

interface CreationBudgetResult {
    xpSpentTotal: number;
    xpSpentAttributes: number;
    xpSpentSkills: number;
    xpSpentBackgrounds: number;
    xpEquivalence: number;
    ranksUsed: Record<number, number>;
    attributesUsed: number;
    backgroundsUsed: number;
    attributeErrors: string[];
    messages: string[];
    overspent: string[];
    hasErrors: boolean;
    formatNumber: (num: number) => string;
    isGlobalPoints: boolean;
    xpRemainingGlobal: number;
}

export function useCreationBudget(): CreationBudgetResult {
    const { data } = useCharacter();
    const { rules } = useRules();

    const { mode, rankSlots, startingXP, pointsDistributionMode, pointsBuckets, attributePoints, backgroundPoints, attributeMin, attributeMax, attributeCost } = data.creationConfig;

    // Defaults
    const minAttr = attributeMin ?? -2;
    const maxAttr = attributeMax ?? 3;
    const attrCostPerPoint = attributeCost ?? 6;

    const getCost = (level: number) => (level * (level + 1)) / 2;

    const formatNumber = (num: number) => {
        return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    };

    const calculateUsage = useMemo(() => {
        let xpSpentTotal = 0;
        let xpSpentAttributes = 0;
        let xpSpentSkills = 0;
        let xpSpentBackgrounds = 0;
        let xpEquivalence = 0;
        const ranksUsed: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let attributesUsed = 0;
        let backgroundsUsed = 0;
        const attributeErrors: string[] = [];

        const countSkill = (skill: DotEntry, catId: string) => {
            const val = skill.value;
            if (val > 0) {
                const cost = getCost(val);
                const cat = rules?.definitions?.skillCategories?.find(c => c.id === catId);
                const behavior = cat?.behavior;
                const multiplier = cat?.costConfig?.factor ?? 1.0;
                const isSecondary = behavior === 'Secondaire' || catId === 'competences2' || catId === 'Col_Comp_6';

                let realCost = 0;

                if (behavior === 'Arrière-plan') {
                    const base = data.creationConfig?.backgroundCost ?? 2;
                    realCost = val * base * multiplier;
                } else if (behavior === 'Compteur') {
                    const counterDef = rules?.definitions?.counters?.[skill.id];
                    const base = Math.max(0, counterDef?.xpCost ?? 5);
                    realCost = val * base * multiplier;
                } else if (isSecondary) {
                    realCost = (cost / 2) * multiplier;
                } else {
                    realCost = cost * multiplier;
                }

                xpEquivalence += realCost;

                if (mode === 'points') {
                    xpSpentTotal += realCost;

                    if (behavior === 'Arrière-plan') {
                        xpSpentBackgrounds += realCost;
                    } else {
                        xpSpentSkills += realCost;
                    }
                } else {
                    // Rangs Mode
                    if (behavior !== 'Arrière-plan') {
                        if (val <= 5) {
                            const slotWeight = isSecondary ? 0.5 : 1;
                            ranksUsed[val] = (ranksUsed[val] || 0) + slotWeight;
                        }
                    } else {
                        backgroundsUsed += val;
                    }
                }
            }
        };

        // Skills - use proper Record access
        Object.keys(data.skills).forEach(key => {
            const skillCategory = (data.skills as Record<string, DotEntry[]>)[key];
            skillCategory.forEach(skill => {
                if (skill.name) {
                    countSkill(skill, key);
                }
            });
        });

        // Attributes
        const attrCats = data.attributeSettings.map(s => s.id);

        attrCats.forEach(cat => {
            data.attributes[cat].forEach(attr => {
                const val = parseInt(attr.val1) || 0;

                if (val < minAttr) {
                    attributeErrors.push(`${attr.name} : ${val} (Min ${minAttr})`);
                }
                if (val > maxAttr) {
                    attributeErrors.push(`${attr.name} : ${val} (Max ${maxAttr})`);
                }

                if (val !== 0) {
                    attributesUsed += val;
                    const attrCost = val * attrCostPerPoint;

                    xpEquivalence += attrCost;

                    if (mode === 'points') {
                        xpSpentTotal += attrCost;
                        xpSpentAttributes += attrCost;
                    }
                }
            });

            // Handle Secondary Attributes
            if (data.secondaryAttributesActive && data.secondaryAttributes[cat]) {
                data.secondaryAttributes[cat].forEach(attr => {
                    const val = parseInt(attr.val1) || 0;
                    if (val !== 0) {
                        const attrCost = val * attrCostPerPoint;
                        xpEquivalence += attrCost;
                        if (mode === 'points') {
                            xpSpentTotal += attrCost;
                            xpSpentAttributes += attrCost;
                        }
                    }
                });
            }
        });

        // Traits (Avantages & Désavantages)
        // Les traits ne coûtent plus d'XP à la création (Mode Rangs ou Points)
        // xpEquivalence reste inchangé ici concernant les traits

        return {
            xpSpentTotal,
            xpSpentAttributes,
            xpSpentSkills,
            xpSpentBackgrounds,
            xpEquivalence,
            ranksUsed,
            attributesUsed,
            backgroundsUsed,
            attributeErrors
        };
    }, [data, rules, mode, minAttr, maxAttr, attrCostPerPoint]);

    const { xpSpentTotal, xpSpentAttributes, xpSpentSkills, xpSpentBackgrounds, xpEquivalence, ranksUsed, attributesUsed, backgroundsUsed, attributeErrors } = calculateUsage;

    const isGlobalPoints = !pointsDistributionMode || pointsDistributionMode === 'global';
    const xpRemainingGlobal = startingXP - xpSpentTotal;

    const getValidationWarnings = useMemo(() => {
        const messages: string[] = [];
        const overspent: string[] = [];

        if (attributeErrors.length > 0) {
            attributeErrors.forEach(err => overspent.push(err));
        }

        if (mode === 'points') {
            if (isGlobalPoints) {
                if (xpRemainingGlobal > 0) messages.push(`Il vous reste ${formatNumber(xpRemainingGlobal)} XP à dépenser.`);
                if (xpRemainingGlobal < 0) overspent.push(`Dépassement de ${formatNumber(Math.abs(xpRemainingGlobal))} XP.`);
            } else {
                const budgetAttrs = pointsBuckets?.attributes || 0;
                const budgetSkills = pointsBuckets?.skills || 0;
                const budgetBg = pointsBuckets?.backgrounds || 0;

                if (xpSpentAttributes > budgetAttrs) overspent.push(`Attributs : Dépassement de ${xpSpentAttributes - budgetAttrs} XP.`);
                if (xpSpentAttributes < budgetAttrs) messages.push(`Attributs : Reste ${budgetAttrs - xpSpentAttributes} XP.`);

                if (xpSpentSkills > budgetSkills) overspent.push(`Compétences : Dépassement de ${xpSpentSkills - budgetSkills} XP.`);
                if (xpSpentSkills < budgetSkills) messages.push(`Compétences : Reste ${budgetSkills - xpSpentSkills} XP.`);

                if (xpSpentBackgrounds > budgetBg) overspent.push(`Arrière-plans : Dépassement de ${xpSpentBackgrounds - budgetBg} XP.`);
                if (xpSpentBackgrounds < budgetBg) messages.push(`Arrière-plans : Reste ${budgetBg - xpSpentBackgrounds} XP.`);
            }
        } else {
            // Attributes (Rangs Mode)
            const attrMax = attributePoints || 15;
            if (attributesUsed < attrMax) messages.push(`Il reste ${attrMax - attributesUsed} points d'Attributs.`);
            if (attributesUsed > attrMax) overspent.push(`Attributs : ${attributesUsed - attrMax} point(s) en trop.`);

            // Backgrounds (Rangs Mode)
            const bgMax = backgroundPoints || 5;
            if (backgroundsUsed < bgMax) messages.push(`Il reste ${bgMax - backgroundsUsed} points d'Arrière-plans.`);
            if (backgroundsUsed > bgMax) overspent.push(`Arrière-plans : ${backgroundsUsed - bgMax} point(s) en trop.`);

            // Ranks - use proper Record access with number keys
            [1, 2, 3, 4, 5].forEach(rank => {
                const max = (rankSlots as Record<number, number>)[rank] || 0;
                if (max === 0) return;
                const used = ranksUsed[rank] || 0;

                if (used < max) messages.push(`Rang ${rank} : Manque ${formatNumber(max - used)} rangs.`);
                if (used > max) overspent.push(`Rang ${rank} : ${formatNumber(used - max)} rangs en trop.`);
            });
        }

        return { messages, overspent };
    }, [mode, isGlobalPoints, xpRemainingGlobal, xpSpentAttributes, xpSpentSkills, xpSpentBackgrounds, pointsBuckets, attributesUsed, backgroundsUsed, ranksUsed, rankSlots, attributePoints, backgroundPoints, attributeErrors, formatNumber]);

    const { messages, overspent } = getValidationWarnings;
    const hasErrors = overspent.length > 0;

    return {
        xpSpentTotal,
        xpSpentAttributes,
        xpSpentSkills,
        xpSpentBackgrounds,
        xpEquivalence,
        ranksUsed,
        attributesUsed,
        backgroundsUsed,
        attributeErrors,
        messages,
        overspent,
        hasErrors,
        formatNumber,
        isGlobalPoints,
        xpRemainingGlobal
    };
}
