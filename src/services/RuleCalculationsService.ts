
import { CharacterSheetData, ExperienceData, TraitEffect, SkillCategoryKey, DotEntry, RulesData } from '../types';
import { normalizeString } from '../utils/stringUtils';

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

        data.page2?.avantages?.forEach(t => findEffects(t.name));
        data.page2?.desavantages?.forEach(t => findEffects(t.name));

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

        // Set of handled counter IDs to avoid double-counting
        const handledCounters = new Set<string>();

        // Calcul des Compétences basé sur skillCategories (Dynamique)
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

                    // Apply Base * Multiplier logic based on behavior
                    if (behavior === 'Arrière-plan') {
                        // Base for backgrounds is backgroundCost from config
                        const baseCost = data.creationConfig?.backgroundCost ?? 2;
                        baseFactor = baseCost * multiplier;
                    }

                    if (behavior === 'Compteur') {
                        // Base for counters is defined in counter definition (System or Library)
                        // Prioritize Library Definition
                        const rulesCounters = rules?.definitions?.counters || {};
                        const libCounters = rules?.libraries?.counters || [];

                        const sysDef = rulesCounters[skill.id];
                        const displayName = skill.name || sysDef?.name || skill.id;

                        const libDef = libCounters.find(c => c.id === skill.id)
                            || libCounters.find(c => normalizeString(c.name) === normalizeString(displayName));

                        const baseCost = libDef?.xpCost !== undefined ? libDef.xpCost : (sysDef?.xpCost ?? 5);


                        const freeBase = libDef?.defaultValue !== undefined ? libDef.defaultValue : (sysDef?.defaultValue ?? 0);

                        // Effective creation value is MAX(creationValue, defaultValue)
                        // If user created at 0 but default is 3, they get 3 for free.
                        const effectiveBase = Math.max(skill.creationValue || 0, freeBase);

                        baseFactor = baseCost * multiplier;
                        handledCounters.add(skill.id);

                        const valCost = this.getXPCost(skill.value, effectiveBase, baseFactor, false);
                        totalSpent += valCost;
                    } else {
                        // Standard calculation (Normal Skills, Backgrounds, etc.)
                        totalSpent += this.getXPCost(skill.value, effectiveCreationValue, baseFactor, isTriangular);
                    }
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

            const bgCostBase = data.creationConfig?.backgroundCost ?? 2;
            const backgroundSkills = data.skills.arrieres_plans || data.skills.Col_Comp_8;
            if (Array.isArray(backgroundSkills)) {
                backgroundSkills.forEach(skill => {
                    // Legacy fallback: assume multiplier 1 if not in categories
                    totalSpent += this.getXPCost(skill.value, skill.creationValue || 0, bgCostBase, false);
                });
            }
        }

        // Compteurs (traitement des compteurs restant non gérés dans les catégories)
        // Priorité : Bibliothèque (Custom) > Définitions (System)
        const rulesCounters = rules?.definitions?.counters || {};
        const libCounters = rules?.libraries?.counters || [];

        if (data.counters) {
            Object.keys(data.counters).forEach(key => {
                if (key === 'custom' || handledCounters.has(key)) return;

                const counterEntry = data.counters[key];

                // Guard against Array (should not happen for non-custom ID but types say DotEntry | DotEntry[])
                if (Array.isArray(counterEntry)) return;

                // Find definition: definitions first, then library fallback? 
                // OR Library override? usually Library overrides system defaults in this app design.
                // Lookup strict ID first, then fuzzy name match using normalization (accent insensitive)
                const sysDef = rulesCounters[key];
                const displayName = counterEntry.name || sysDef?.name || key;

                const libDef = libCounters.find(c => c.id === key)
                    || libCounters.find(c => normalizeString(c.name) === normalizeString(displayName));


                const xpCost = libDef?.xpCost !== undefined ? libDef.xpCost : (sysDef?.xpCost ?? 0);


                if (counterEntry && !Array.isArray(counterEntry) && xpCost > 0) {
                    // Check if this counter is assigned to a category to get its multiplier
                    let multiplier = 1.0;
                    const catId = Object.keys(data.skills).find(cid => {
                        const list = data.skills[cid];
                        return Array.isArray(list) && list.some(s => s.id === key);
                    });

                    if (catId && categories) {
                        const cat = categories.find(c => c.id === catId);
                        if (cat) multiplier = cat.costConfig?.factor ?? 1.0;
                    }

                    totalSpent += this.getXPCost(counterEntry.value, counterEntry.creationValue || 0, xpCost * multiplier, false);
                }
            });

            // Traitement des compteurs "Custom" (Legacy / Ad-hoc)
            if (data.counters.custom && Array.isArray(data.counters.custom)) {
                data.counters.custom.forEach(counter => {
                    // Ignorer si déjà traité (peu probable car custom n'est pas une clé racine, mais sécurité)
                    if (handledCounters.has(counter.id)) return;


                    // Recherche de définition (Bibliothèque)
                    const libDef = libCounters.find(c => c.id === counter.id)
                        || libCounters.find(c => normalizeString(c.name) === normalizeString(counter.name));


                    // Fallback vers définition système (via nom)
                    const sysDef = Object.values(rulesCounters).find(c => c.name === counter.name);

                    // Coût XP effectif
                    const xpCost = libDef?.xpCost !== undefined ? libDef.xpCost : (sysDef?.xpCost ?? 0);

                    if (counter.name.toLowerCase().includes('test')) {
                        /* console.log(`[XP Debug] - Final xpCost: ${xpCost}`); */
                    }

                    if (xpCost > 0) {
                        // Compteur Custom = Toujours facteur 1.0 (sauf si un jour on les lie aux catégories, mais c'est le cas désactivé plus haut)
                        // On ne vérifie pas l'appartenance à une catégorie pour les "custom array" car ils ne devraient pas y être (c'est les IDs système qui y sont).

                        // Base de calcul : Max(creationValue, defaultValue du modèle)
                        // Souvent pour custom, creationValue est 0 ou correct.
                        const modelDefault = libDef?.defaultValue ?? (sysDef?.defaultValue ?? 0);
                        const creationValue = Math.max(counter.creationValue || 0, modelDefault);

                        const cost = this.getXPCost(counter.value, creationValue, xpCost, false);
                        if (counter.name.toLowerCase().includes('test')) { /* console.log(`[XP Debug] - Calculated Cost: ${cost} (val=${counter.value}, base=${creationValue})`); */ }

                        totalSpent += cost;
                    }
                });
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
