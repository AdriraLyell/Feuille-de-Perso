
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

        const getSpentForValue = (value: number, creationValue: number = 0) => {
            if (value === 0) return 0;
            if (value <= creationValue) return 0;
            return triangular(value) - triangular(creationValue);
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
                    
                    total += getSpentForValue(skill.value, effectiveCreationValue);
                });
            }
        });

        const secondSkills = currentData.skills.competences2;
        if (Array.isArray(secondSkills)) {
            secondSkills.forEach(skill => {
                 const freeLimit = getFreeRankLimit(skill.name);
                 const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                 const cost = getSpentForValue(skill.value, effectiveCreationValue);
                 total += cost / 2;
            });
        }

        const backgroundSkills = currentData.skills.arrieres_plans;
        if (Array.isArray(backgroundSkills)) {
            backgroundSkills.forEach(skill => {
                if (skill.value === 0) return; 
                const diff = Math.max(0, skill.value - (skill.creationValue || 0));
                total += diff * 2;
            });
        }

        const attrCostMult = currentData.creationConfig.attributeCost || 6;

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
                        
                        const diff1 = Math.max(0, val - effectiveCreation);
                        
                        total += diff1 * attrCostMult;
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
