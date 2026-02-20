import { CharacterSheetData, RulesData, ExperienceBreakdownItem } from '../../../types';
import { normalizeString } from '../../stringUtils';
import { getXPCost } from './xpCore';

/**
 * Calcule l'XP dépensée dans les compétences
 */
export function calculateSkillXP(
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
