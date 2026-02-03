
import { CharacterSheetData, ExperienceData, TraitEffect, SkillCategoryKey, DotEntry } from '../types';

// --- XP CALCULATION LOGIC ---
export const calculateExperienceResults = (data: CharacterSheetData): ExperienceData => {
    // 0. Extract Active Effects from Traits (Avantages/Désavantages)
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

    // Calculate Bonus XP from Traits
    const traitXPBonus = activeEffects
        .filter(e => e.type === 'xp_bonus')
        .reduce((sum, e) => sum + e.value, 0);

    // 1. Calculate Spent XP
    const calculateTotalSpent = (currentData: CharacterSheetData) => {
        let total = 0;
        const triangular = (n: number) => (n * (n + 1)) / 2;

        // Default Factors (1.0 for standard, 0.5 for spec/secondary)
        const skillFactor = currentData.xpCosts?.skillFactor ?? 1.0;
        const specFactor = currentData.xpCosts?.specializationFactor ?? 0.5;
        // Attributes have their own linear cost logic (Default 6)

        const getSpentForValue = (value: number, creationValue: number = 0, factor: number = 1.0) => {
            if (value === 0) return 0;
            if (value <= creationValue) return 0;

            // Formula: (Triangular(Target) - Triangular(Start)) * Factor
            // Example: 0 -> 2 (Target 3) => (3 - 0) * Factor
            const baseCost = triangular(value) - triangular(creationValue);
            return baseCost * factor;
        };

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

        const standardCategories: SkillCategoryKey[] = [
            'talents', 'competences', 'competences_col_2', 'connaissances',
            'autres_competences', 'autres'
        ];

        standardCategories.forEach(key => {
            const skillList = currentData.skills[key];
            if (Array.isArray(skillList)) {
                skillList.forEach(skill => {
                    const freeLimit = getFreeRankLimit(skill.name);
                    const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);

                    total += getSpentForValue(skill.value, effectiveCreationValue, skillFactor);
                });
            }
        });

        // Secondary Skills (Usually half cost, or configurable via specific logic, 
        // but here we align with the "Specialization" factor logic or keep hardcoded 0.5? 
        // User said "Like skills but divided by 2", so let's use specFactor or skillFactor * 0.5?
        // Let's use specFactor as it represents "half cost" things generally in this system.)
        const secondSkills = currentData.skills.competences2;
        if (Array.isArray(secondSkills)) {
            secondSkills.forEach(skill => {
                const freeLimit = getFreeRankLimit(skill.name);
                const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                total += getSpentForValue(skill.value, effectiveCreationValue, specFactor);
            });
        }

        // Backgrounds (Usually x2 flat cost in original, but if we move to formula... 
        // Original code was `diff * 2`. Formula is Triangle * Factor.
        // Let's assume Backgrounds keep their specific logic OR use a factor.
        // For now, preserving old logic as user didn't explicitly ask to change backgrounds formula,
        // just "C'est comme les compétences mais divisé par 2" regarding Specializations (which implies new Formula).
        // Let's apply formula with factor 1.0 for Backgrounds? No, typically linear.
        // Let's keep Backgrounds as LINEAR x2 for now (Legacy safe mode). 
        // Wait, user said "il y a une formule, c'est rang 1 = 1..." which is triangular.
        // Let's stick to Triangular for everything "Skill-like".
        // Backgrounds are often linear. Let's keep them linear x2 to avoid breaking them.)
        // Backgrounds
        // Use configured cost or default to 2 (Linear)
        const bgCost = currentData.creationConfig?.backgroundCost ?? 2;
        const backgroundSkills = currentData.skills.arrieres_plans;
        if (Array.isArray(backgroundSkills)) {
            backgroundSkills.forEach(skill => {
                if (skill.value === 0) return;
                const diff = Math.max(0, skill.value - (skill.creationValue || 0));
                total += diff * bgCost;
            });
        }

        // Counters (Volonté, Confiance, etc.)
        // We need to look up their definition to know the XP cost?
        // Problem: CharacterSheetData doesn't store the "Definition" (xpCost), only the value.
        // We rely on rules.definitions.counters which is NOT in data directly.
        // BUT `data.counters` entries are simple `DotEntry`.
        // We must inspect `window.EXTERNAL_RULES` or assume we can't calculate it without rules?
        // OR: We embed the `xpCost` in the `DotEntry` for counters?
        // Let's assume we can access `window.EXTERNAL_RULES` here as mechanics runs in the browser.
        // Ideally we should pass rules to this function, but signature change is heavy.
        // Let's rely on valid "XP Cost" being inferred or passed.
        // ACTUALLY: `mechanics.ts` is pure. 
        // Solution: When applying rules, we should store `xpCost` in the Counter DotEntry specifically?
        // Current `DotEntry` doesn't have `xpCost`.
        // Let's assume standard names "volonte", "confiance" have hardcoded defaults if rules missing?
        // No, user wants DYNAMIC. 
        // Best approach: Use `window.EXTERNAL_RULES` if available for lookup.

        // @ts-ignore
        const rulesCounters = window.EXTERNAL_RULES?.definitions?.counters;

        if (rulesCounters && currentData.counters) {
            Object.keys(currentData.counters).forEach(key => {
                if (key === 'custom') return;
                // @ts-ignore
                const counterEntry = currentData.counters[key];
                const def = rulesCounters[key];

                // Ensure it is a single DotEntry (not array)
                if (counterEntry && !Array.isArray(counterEntry) && def && def.xpCost > 0) {
                    // Cost is usually Linear for counters? "Volonté coûte 5 par point".
                    // Yes, linear.
                    const diff = Math.max(0, counterEntry.value - (counterEntry.creationValue || 0));
                    total += diff * def.xpCost;
                }
            });
        } else {
            // Fallback for hardcoded "volonte" if no rules loaded (Backward compat)
            // Check if volonte exists and is not an array
            const v = currentData.counters.volonte;
            if (v && !Array.isArray(v)) {
                const diff = Math.max(0, v.value - (v.creationValue || 0));
                total += diff * 5; // Default legacy cost
            }
        }

        // Specializations (Count them) of CURRENT value
        // Note: Specializations don't have "ranks" usually in this data model, they are just strings?
        // Let's check data.specializations.
        const specs = currentData.specializations || {};
        Object.values(specs).forEach(list => {
            // Each specialization costs X.
            // If they are just "bought", they are flat cost?
            // "Pour les spécialisations, c'est comme les compétence mais divisé par 2".
            // If spec has no rank, it's a flat buy. 
            // Triangle(1) = 1. So buying "Rank 1" of a spec = 1 * Factor.
            // If Factor is 0.5, then cost is 0.5.
            total += list.length * (1 * specFactor);
        });

        // Imposed Specializations are free usually? Yes via config.

        if (currentData.attributeSettings) {
            currentData.attributeSettings.forEach(cat => {
                const attrs = currentData.attributes[cat.id];
                const secAttrs = currentData.secondaryAttributesActive ? currentData.secondaryAttributes[cat.id] : [];

                const allAttrs = [...(attrs || []), ...(secAttrs || [])];

                if (allAttrs) {
                    allAttrs.forEach(attr => {
                        const val = parseInt(attr.val1) || 0;
                        if (val === 0) return;

                        const bonus = getAttributeBonus(attr.name);
                        const effectiveCreation = (attr.creationVal1 || 0) + bonus;

                        // Attributes are Linear (6 per point default)
                        // User Request: "les attribut ne coutent pas comme els compétences... 6 par point"
                        const diff = Math.max(0, val - effectiveCreation);

                        // Use attributeFactor as the "Cost per point" (Default 6)
                        const costPerPoint = currentData.xpCosts?.attributeFactor ?? 6;

                        total += diff * costPerPoint;
                    });
                }
            });
        }

        return total;
    };

    const calculateTotalGain = (currentData: CharacterSheetData) => {
        return (currentData.xpLogs || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);
    };

    const spent = calculateTotalSpent(data);
    const gainFromLogs = calculateTotalGain(data);

    const totalGain = gainFromLogs + traitXPBonus;

    const gainString = traitXPBonus > 0
        ? `${gainFromLogs} (+${traitXPBonus})`
        : gainFromLogs.toString();

    const rest = totalGain - spent;

    return {
        gain: gainString,
        spent: spent.toString(),
        rest: rest.toString()
    };
};

// --- CARD CALCULATION LOGIC ---
export const calculateCardValue = (data: CharacterSheetData): string | null => {
    // Check if feature is active
    const cardConfig = data.creationConfig?.cardConfig;
    if (!cardConfig || !cardConfig.active) return null;

    // 1. Gather all skills EXCLUDING background (arrieres_plans)
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

    // 2. Sort Descending
    allSkills.sort((a, b) => b - a);

    // 3. Take Top N
    const n = cardConfig.bestSkillsCount;
    const topSkills = allSkills.slice(0, n);

    // If not enough skills, treat missing as 0
    while (topSkills.length < n) {
        topSkills.push(0);
    }

    // 4. Calculate Average
    const sum = topSkills.reduce((a, b) => a + b, 0);
    const average = sum / n;

    // 5. Determine Card
    const delta = average - cardConfig.baseStart;
    const steps = Math.floor((delta + 0.0001) / cardConfig.increment);

    let cardName = "Aucune";

    if (steps >= 1) {
        const globalIndex = steps - 1; // 0-based index
        const rankIndex = Math.floor(globalIndex / 4); // 0=Valet, 1=Dame, 2=Roi
        const countIndex = globalIndex % 4; // 0=Un, 1=Deux, ...

        const counts = ["Un", "Deux", "Trois", "Quatre"];
        const ranksSingular = ["Valet", "Dame", "Roi"];
        const ranksPlural = ["Valets", "Dames", "Rois"];

        if (rankIndex < 3) {
            const countStr = counts[countIndex];
            const rankStr = countIndex === 0 ? ranksSingular[rankIndex] : ranksPlural[rankIndex];
            cardName = `${countStr} ${rankStr}`;
        } else {
            cardName = "Quatre Rois (Max)";
        }
    }

    return cardName;
};
