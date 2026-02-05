
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

        // Compétences Standard
        const standardCategories: SkillCategoryKey[] = [
            'talents', 'competences', 'competences_col_2', 'connaissances',
            'autres_competences', 'autres'
        ];

        standardCategories.forEach(key => {
            const skillList = data.skills[key];
            if (Array.isArray(skillList)) {
                skillList.forEach(skill => {
                    const freeLimit = getFreeRankLimit(skill.name);
                    const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                    totalSpent += this.getXPCost(skill.value, effectiveCreationValue, skillFactor, true);
                });
            }
        });

        // Compétences Secondaires
        const secondSkills = data.skills.competences2;
        if (Array.isArray(secondSkills)) {
            secondSkills.forEach(skill => {
                const freeLimit = getFreeRankLimit(skill.name);
                const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                totalSpent += this.getXPCost(skill.value, effectiveCreationValue, specFactor, true);
            });
        }

        // Arrière-Plans (Coût Linéaire)
        const bgCost = data.creationConfig?.backgroundCost ?? 2;
        const backgroundSkills = data.skills.arrieres_plans;
        if (Array.isArray(backgroundSkills)) {
            backgroundSkills.forEach(skill => {
                totalSpent += this.getXPCost(skill.value, skill.creationValue || 0, bgCost, false);
            });
        }

        // Compteurs (Volonté, Confiance, etc.)
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

        // Spécialisations
        const specs = data.specializations || {};
        Object.values(specs).forEach(list => {
            // Une spécialisation coûte Triangle(1) * specFactor = 1 * factor
            totalSpent += list.length * (1 * specFactor);
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
    calculateCardValue(data: CharacterSheetData): string | null {
        const cardConfig = data.creationConfig?.cardConfig;
        if (!cardConfig || !cardConfig.active) return null;

        const allSkills: number[] = [];
        Object.keys(data.skills).forEach(key => {
            if (key === 'arrieres_plans') return;
            // @ts-ignore
            const list = data.skills[key] || [];
            list.forEach((skill: DotEntry) => {
                if (skill.name && skill.value > 0) {
                    allSkills.push(skill.value);
                }
            });
        });

        allSkills.sort((a, b) => b - a);
        const n = cardConfig.bestSkillsCount;
        const topSkills = allSkills.slice(0, n);
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
