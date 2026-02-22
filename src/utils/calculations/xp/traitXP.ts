import { CharacterSheetData, RulesData, ExperienceBreakdownItem } from '../../../types';

/**
 * Calcule l'XP dépensée dans les traits (Avantages / Désavantages)
 */
export function calculateTraitXP(data: CharacterSheetData, rules: RulesData | undefined): { total: number, breakdown: ExperienceBreakdownItem[] } {
    const traitCostFactor = rules?.configurations?.xpCosts?.traitCost ?? (data.xpCosts?.traitCost ?? 5);
    const breakdown: ExperienceBreakdownItem[] = [];

    if (data.creationConfig?.active) return { total: 0, breakdown: [] };

    let traitSpent = 0;

    // 1. Avantages achetés ou améliorés post-création
    data.page2.avantages?.forEach(trait => {
        if (trait.isPostCreation) {
            const val = parseInt(trait.value) || 0;
            const cost = val * traitCostFactor;
            if (cost > 0) {
                traitSpent += cost;
                breakdown.push({ name: trait.name, amount: -cost });
            }
        } else if (trait.creationValue !== undefined) {
            const currentVal = parseInt(trait.value) || 0;
            const creationVal = parseInt(trait.creationValue) || 0;
            const diff = Math.max(0, currentVal - creationVal);
            if (diff > 0) {
                const cost = diff * traitCostFactor;
                traitSpent += cost;
                breakdown.push({ name: `Amélioration : ${trait.name}`, amount: -cost });
            }
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
