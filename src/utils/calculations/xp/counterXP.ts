import { CharacterSheetData, RulesData, ExperienceBreakdownItem } from '../../../types';
import { normalizeString } from '../../stringUtils';
import { getXPCost } from './xpCore';

/**
 * Calcule l'XP dépensée dans les compteurs restants
 */
export function calculateCounterXP(
    data: CharacterSheetData,
    rules: RulesData | undefined,
    handledCounters: Set<string>
): { total: number, breakdown: ExperienceBreakdownItem[] } {
    let counterSpent = 0;
    const breakdown: ExperienceBreakdownItem[] = [];
    if (!data.counters) return { total: 0, breakdown: [] };

    const rulesCounters = rules?.definitions?.counters || {};
    const libCounters = rules?.libraries?.counters || [];
    const categories = rules?.definitions?.skillCategories;

    Object.keys(data.counters).forEach(key => {
        if (key === 'custom' || handledCounters.has(key)) return;
        const counterEntry = data.counters[key];
        if (Array.isArray(counterEntry)) return;

        const sysDef = rulesCounters[key];
        const displayName = counterEntry.name || sysDef?.name || key;
        const libDef = libCounters.find(c => c.id === key)
            || libCounters.find(c => normalizeString(c.name) === normalizeString(displayName));

        const xpCost = libDef?.xpCost != null ? libDef.xpCost : (sysDef?.xpCost ?? 0);

        if (xpCost > 0) {
            let multiplier = 1.0;
            const catId = Object.keys(data.skills).find(cid => {
                const list = data.skills[cid];
                return Array.isArray(list) && list.some(s => s.id === key);
            });

            if (catId && categories) {
                const cat = categories.find(c => c.id === catId);
                if (cat) multiplier = cat.costConfig?.factor ?? 1.0;
            }
            const cost = getXPCost(counterEntry.value, counterEntry.creationValue || 0, xpCost * multiplier, false);
            if (cost > 0) {
                counterSpent += cost;
                breakdown.push({ name: counterEntry.name, amount: -cost });
            }
        }
    });

    if (data.counters.custom && Array.isArray(data.counters.custom)) {
        data.counters.custom.forEach(counter => {
            if (handledCounters.has(counter.id)) return;
            const libDef = libCounters.find(c => c.id === counter.id)
                || libCounters.find(c => normalizeString(c.name) === normalizeString(counter.name));
            const sysDef = Object.values(rulesCounters).find(c => c.name === counter.name);

            const xpCost = libDef?.xpCost != null ? libDef.xpCost : (sysDef?.xpCost ?? 0);

            if (xpCost > 0) {
                const modelDefault = libDef?.defaultValue != null ? libDef.defaultValue : (sysDef?.defaultValue ?? 0);
                const creationValue = Math.max(counter.creationValue || 0, modelDefault);
                const cost = getXPCost(counter.value, creationValue, xpCost, false);
                if (cost > 0) {
                    counterSpent += cost;
                    breakdown.push({ name: counter.name, amount: -cost });
                }
            }
        });
    }
    return { total: counterSpent, breakdown };
}
