
import { CharacterSheetData, ExperienceData, TraitEffect, SkillCategoryKey, DotEntry, RulesData } from '../types';

/**
 * Service centralisant les formules de calcul des règles du jeu.
 * Utilisé par la feuille de personnage (Joueur) et l'éditeur de règles (Admin).
 */
export const RuleCalculationsService = {

    /**
     * Calcule la somme triangulaire : n + (n-1) + ... + 1
     */
    triangular(n: number): number {
        return (n * (n + 1)) / 2;
    },

    /**
     * Calcule le coût en XP pour passer d'un niveau de création à un niveau actuel
     */
    getXPCost(currentValue: number, creationValue: number = 0, factor: number = 1.0, useTriangular: boolean = true): number {
        if (currentValue === 0 || currentValue <= creationValue) return 0;

        if (useTriangular) {
            const baseCost = this.triangular(currentValue) - this.triangular(creationValue);
            return baseCost * factor;
        } else {
            // Coût linéaire
            const diff = Math.max(0, currentValue - creationValue);
            return diff * factor;
        }
    },

    /**
     * Calcule le bilan d'XP complet pour un personnage
     */
    calculateExperienceResults(data: CharacterSheetData, rules?: RulesData): ExperienceData {
        // 0. Extraction des effets actifs des traits
        const activeEffects: TraitEffect[] = [];
        const findEffects = (traitName: string) => {
            if (!traitName) return;
            const entry = data.library?.find(l => l.name.trim().toLowerCase() === traitName.trim().toLowerCase());
            if (entry && entry.effects) {
                entry.effects.forEach(e => activeEffects.push(e));
            }
        };

        data.page2.avantages.forEach(t => findEffects(t.name));
        data.page2.desavantages.forEach(t => findEffects(t.name));

        const traitXPBonus = activeEffects
            .filter(e => e.type === 'xp_bonus')
            .reduce((sum, e) => sum + e.value, 0);

        // 1. Calcul de l'XP dépensée
        let totalSpent = 0;
        const skillFactor = data.xpCosts?.skillFactor ?? 1.0;
        const specFactor = data.xpCosts?.specializationFactor ?? 0.5;

        // Helpers pour les bonus
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

        // Calcul des Compétences basé sur skillCategories (Dynamique)
        const categories = rules?.definitions?.skillCategories;

        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const skillList = data.skills[cat.id];
                if (!Array.isArray(skillList)) return;

                const factor = cat.costConfig?.factor ?? skillFactor;
                const isTriangular = cat.costConfig?.type === 'triangular';

                skillList.forEach(skill => {
                    const freeLimit = getFreeRankLimit(skill.name);
                    const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                    totalSpent += this.getXPCost(skill.value, effectiveCreationValue, factor, isTriangular);
                });
            });
        } else {
            // Fallback Legacy (Anciens persos ou règles sans skillCategories)
            const standardCategories = ['talents', 'competences', 'competences_col_2', 'connaissances', 'autres_competences', 'autres', 'Col_Comp_1', 'Col_Comp_2', 'Col_Comp_3', 'Col_Comp_4', 'Col_Comp_5', 'Col_Comp_7'];
            standardCategories.forEach(key => {
                const list = data.skills[key];
                if (Array.isArray(list)) {
                    list.forEach(skill => {
                        const freeLimit = getFreeRankLimit(skill.name);
                        const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                        totalSpent += this.getXPCost(skill.value, effectiveCreationValue, skillFactor, true);
                    });
                }
            });

            const secondSkills = data.skills.competences2 || data.skills.Col_Comp_6;
            if (Array.isArray(secondSkills)) {
                secondSkills.forEach(skill => {
                    const freeLimit = getFreeRankLimit(skill.name);
                    const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                    totalSpent += this.getXPCost(skill.value, effectiveCreationValue, specFactor, true);
                });
            }

            const bgCostValue = data.creationConfig?.backgroundCost ?? 2;
            const backgroundSkills = data.skills.arrieres_plans || data.skills.Col_Comp_8;
            if (Array.isArray(backgroundSkills)) {
                backgroundSkills.forEach(skill => {
                    totalSpent += this.getXPCost(skill.value, skill.creationValue || 0, bgCostValue, false);
                });
            }
        }

        // Compteurs (toujours géré par rules.definitions.counters pour l'instant)
        const rulesCounters = rules?.definitions?.counters;
        if (rulesCounters && data.counters) {
            Object.keys(data.counters).forEach(key => {
                if (key === 'custom') return;
                // @ts-ignore
                const counterEntry = data.counters[key];
                const def = rulesCounters[key];
                if (counterEntry && !Array.isArray(counterEntry) && def && def.xpCost > 0) {
                    totalSpent += this.getXPCost(counterEntry.value, counterEntry.creationValue || 0, def.xpCost, false);
                }
            });
        } else {
            const v = data.counters.volonte;
            if (v && !Array.isArray(v)) {
                totalSpent += this.getXPCost(v.value, v.creationValue || 0, 5, false);
            }
        }

        // Spécialisations (Coût 0 par défaut)
        const specs = data.specializations || {};
        Object.values(specs).forEach(list => {
            // Les spécialisations ne coûtent plus d'XP
            totalSpent += 0;
        });

        // Attributs (Coût Linéaire)
        if (data.attributeSettings) {
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
                        totalSpent += this.getXPCost(val, effectiveCreation, costPerPoint, false);
                    });
                }
            });
        }

        const gainFromLogs = (data.xpLogs || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);
        const totalGain = gainFromLogs + traitXPBonus;

        return {
            gain: traitXPBonus > 0 ? `${gainFromLogs} (+${traitXPBonus})` : gainFromLogs.toString(),
            spent: totalSpent.toString(),
            rest: (totalGain - totalSpent).toString()
        };
    },

    /**
     * Calcule la valeur de la carte de tarot basée sur les meilleures compétences
     */
    calculateCardValue(data: CharacterSheetData, rules: RulesData | null): string | null {
        const cardConfig = data.creationConfig?.cardConfig;
        if (!cardConfig || !cardConfig.active) return null;

        const cardSkills: number[] = [];
        const rulesCategories = data.skills;

        Object.keys(rulesCategories).forEach(key => {
            // On ignore les arrière-plans et compteurs pour le tarot (Logique métier)
            const catConfig = data.creationConfig?.rankSlots ? rules?.definitions?.skillCategories?.find(c => c.id === key) : null;
            if (catConfig && (catConfig.behavior === 'Arrière-plan' || catConfig.behavior === 'Compteur')) return;

            // Fallback pour anciens IDs
            if (key === 'arrieres_plans' || key === 'counters' || key === 'Col_Comp_8' || key === 'Col_Comp_9') return;

            const list = rulesCategories[key] || [];
            list.forEach((skill: DotEntry) => {
                if (skill.name && skill.value > 0) {
                    cardSkills.push(skill.value);
                }
            });
        });

        cardSkills.sort((a, b) => b - a);
        const n = cardConfig.bestSkillsCount || 3;
        const topSkills = cardSkills.slice(0, n);
        while (topSkills.length < n) topSkills.push(0);

        const average = topSkills.reduce((a, b) => a + b, 0) / n;
        const delta = average - cardConfig.baseStart;
        const steps = Math.floor((delta + 0.0001) / cardConfig.increment);

        if (steps < 1) return "Aucune";

        const globalIndex = steps - 1;
        const rankIndex = Math.floor(globalIndex / 4);
        const countIndex = globalIndex % 4;

        const counts = ["Un", "Deux", "Trois", "Quatre"];
        const ranksSingular = ["Valet", "Dame", "Roi"];
        const ranksPlural = ["Valets", "Dames", "Rois"];

        if (rankIndex < 3) {
            const countStr = counts[countIndex];
            const rankStr = countIndex === 0 ? ranksSingular[rankIndex] : ranksPlural[rankIndex];
            return `${countStr} ${rankStr}`;
        }
        return "Quatre Rois (Max)";
    }
};
