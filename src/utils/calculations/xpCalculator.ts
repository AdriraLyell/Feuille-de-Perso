import {
    CharacterSheetData,
    ExperienceData,
    ExperienceBreakdownItem,
    TraitEffect,
    RulesData
} from '../../types';
import { normalizeString } from '../stringUtils';
import { calculateAttributeXP } from './xp/attributeXP';
import { calculateTraitXP } from './xp/traitXP';
import { calculateCounterXP } from './xp/counterXP';
import { calculateSkillXP } from './xp/skillXP';

export { triangular, getXPCost } from './xp/xpCore';

/**
 * Calcule le bilan d'XP complet pour un personnage
 */
export const calculateExperienceResults = (data: CharacterSheetData, rules?: RulesData): ExperienceData => {
    // 0. Extraction des effets actifs des traits
    const activeEffects = getActiveTraitEffects(data, rules);

    // 1. Helpers pour les bonus
    const getFreeRankLimit = (skillName: string) => {
        // 1. Bonus via free_skill_rank trait effect
        const effect = activeEffects.find(e =>
            e.type === 'free_skill_rank' &&
            e.target &&
            skillName.trim().toLowerCase() === e.target.trim().toLowerCase()
        );
        if (effect) return effect.value;

        // 2. Compétence maîtrisée via master_skill : rang 5 entièrement gratuit
        const normalizedSkillName = skillName.trim().toLowerCase();
        const hasMasterEffect = [
            ...(data.page2?.avantages || []),
            ...(data.page2?.desavantages || [])
        ].some(trait =>
            trait.masterSkillTarget &&
            trait.masterSkillTarget.trim().toLowerCase() === normalizedSkillName
        );
        if (hasMasterEffect) return 5;

        return 0;
    };

    // Calcul des bonus XP (Fixe vs Par Scénario)
    const xpEffects = activeEffects.filter(e => e.type === 'xp_bonus');

    // Bonus Fixes
    const fixedBonusBreakdown: ExperienceBreakdownItem[] = xpEffects
        .filter(e => !e.method || e.method === 'fixed' && e.value !== 0)
        .map(e => ({ name: `Bonus : ${e.source || 'Trait'}`, amount: e.value }));

    const fixedBonus = fixedBonusBreakdown.reduce((sum, e) => sum + e.amount, 0);

    // Bonus par Scénario
    const scenarioLogs = (data.xpLogs || []).filter(log =>
        log.countsAsScenario !== undefined
            ? log.countsAsScenario
            : (log.amount > 0 || (log.scenario && log.scenario.trim() !== ''))
    );
    const scenarioCount = scenarioLogs.length;

    const scenarioBonusBreakdown: ExperienceBreakdownItem[] = xpEffects
        .filter(e => e.method === 'per_scenario' && e.value !== 0)
        .map(e => ({
            name: `Bonus : ${e.source || 'Apprentissage'} (${scenarioCount} sessions)`,
            amount: e.value * scenarioCount
        }));

    const perScenarioBonus = scenarioBonusBreakdown.reduce((sum, e) => sum + e.amount, 0);

    const totalTraitXP = fixedBonus + perScenarioBonus;

    // Gains de base (Log)
    const baseGainsBreakdown: ExperienceBreakdownItem[] = (data.xpLogs || [])
        .filter(entry => entry.amount !== 0)
        .map(entry => ({
            name: entry.scenario || (entry.date ? `Session ${entry.date}` : 'Gain divers'),
            amount: entry.amount
        }));

    const gainFromLogs = baseGainsBreakdown.reduce((sum, e) => sum + e.amount, 0);
    const totalGain = gainFromLogs + totalTraitXP;

    // 2. Calcul de l'XP dépensée
    const handledCounters = new Set<string>();

    const skillResult = calculateSkillXP(data, rules, getFreeRankLimit, handledCounters);
    const counterResult = calculateCounterXP(data, rules, handledCounters);
    const attributeResult = calculateAttributeXP(data);
    const traitResult = calculateTraitXP(data, rules);

    const totalSpent = skillResult.total + counterResult.total + attributeResult.total + traitResult.total;

    // 3. Construction du bilan final
    let gainDisplay = totalGain.toString();
    let tooltip = `Total : ${totalGain} XP\n\nBase (Historique) : ${gainFromLogs}`;

    if (totalTraitXP > 0) {
        gainDisplay += ` (+${totalTraitXP})`;
        if (fixedBonus > 0) tooltip += `\nBonus Fixe : +${fixedBonus}`;
        if (perScenarioBonus > 0) tooltip += `\nBonus Scénarios (${scenarioCount} sessions) : +${perScenarioBonus}`;
    }

    return {
        gain: gainDisplay,
        gainTooltip: tooltip,
        spent: totalSpent.toString(),
        rest: (totalGain - totalSpent).toString(),
        breakdown: {
            gains: [...baseGainsBreakdown, ...fixedBonusBreakdown, ...scenarioBonusBreakdown],
            attributes: attributeResult.breakdown,
            skills: skillResult.breakdown,
            traits: traitResult.breakdown,
            counters: counterResult.breakdown
        }
    };
};

/**
 * Extrait tous les effets de traits actifs du personnage
 * Recherche d'abord dans la bibliothèque locale, puis dans les règles globales
 */
function getActiveTraitEffects(data: CharacterSheetData, rules?: RulesData): TraitEffect[] {
    const activeEffects: TraitEffect[] = [];

    const globalTraits = rules?.libraries?.traits || [];
    const globalTraitMap = new Map(globalTraits.map(t => [normalizeString(t.name), t]));

    const findEffects = (traitName: string) => {
        if (!traitName) return;
        const normalizedName = normalizeString(traitName);

        // 1. Recherche Local
        const localEntry = data.library?.find(l => normalizeString(l.name) === normalizedName);
        if (localEntry && localEntry.effects && localEntry.effects.length > 0) {
            localEntry.effects.forEach(e => activeEffects.push({ ...e, source: localEntry.name }));
            return;
        }

        // 2. Recherche Global
        const globalEntry = globalTraitMap.get(normalizedName);
        if (globalEntry && globalEntry.effects && globalEntry.effects.length > 0) {
            globalEntry.effects.forEach(e => activeEffects.push({ ...e, source: globalEntry.name }));
        }
    };

    data.page2?.avantages?.forEach(t => findEffects(t.name));
    data.page2?.desavantages?.forEach(t => findEffects(t.name));
    return activeEffects;
}
