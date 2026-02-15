import { CharacterSheetData, RulesData, DotEntry } from '../../types';

/**
 * Calcule la valeur de la carte de tarot basée sur les meilleures compétences
 */
export const calculateCardValue = (data: CharacterSheetData, rules: RulesData | null): string | null => {
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
};
