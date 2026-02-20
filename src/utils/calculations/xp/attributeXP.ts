import { CharacterSheetData, ExperienceBreakdownItem } from '../../../types';

/**
 * Calcule l'XP dépensée dans les attributs
 */
export function calculateAttributeXP(
    data: CharacterSheetData
): { total: number, breakdown: ExperienceBreakdownItem[] } {
    let attrSpent = 0;
    const breakdown: ExperienceBreakdownItem[] = [];
    if (!data.attributeSettings) return { total: 0, breakdown: [] };

    data.attributeSettings.forEach(cat => {
        const attrs = data.attributes[cat.id];
        const secAttrs = data.secondaryAttributesActive ? data.secondaryAttributes[cat.id] : [];
        const allAttrs = [...(attrs || []), ...(secAttrs || [])];

        if (allAttrs) {
            allAttrs.forEach(attr => {
                const val2 = parseInt(attr.val2) || 0;
                if (val2 > 0) {
                    const costPerPoint = data.xpCosts?.attributeFactor ?? 6;
                    const cost = val2 * costPerPoint;
                    attrSpent += cost;
                    breakdown.push({ name: attr.name, amount: -cost, count: val2 });
                }
            });
        }
    });
    return { total: attrSpent, breakdown };
}
