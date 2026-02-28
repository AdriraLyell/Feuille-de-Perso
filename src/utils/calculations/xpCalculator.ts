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
import { evaluateFormula } from '../formulaEvaluator';
import { logger } from '../../utils/logger';

export { triangular, getXPCost } from './xp/xpCore';

interface ActiveEffect extends TraitEffect {
    traitLevel: number;
}

/**
 * Calcule le bilan d'XP complet pour un personnage
 */
export const calculateExperienceResults = (data: CharacterSheetData, rules?: RulesData): ExperienceData => {
    // 0. Extraction des effets actifs des traits
    const activeEffects: ActiveEffect[] = getActiveTraitEffects(data, rules);

    // 1. Helpers pour les bonus
    const getFreeRankLimit = (skillName: string) => {
        const normalizedSkillName = skillName.trim().toLowerCase();

        // 1. Bonus via trait effects (including formula-derived ones)
        const effect = activeEffects.find(e => {
            const effectiveType = (e as any).inferredEffectType || e.type;
            const effectiveTarget = e.target || (e as any).inferredTarget;

            return (effectiveType === 'free_skill_rank' ||
                (effectiveType === 'formula' && effectiveTarget === skillName)) &&
                effectiveTarget &&
                normalizedSkillName === effectiveTarget.trim().toLowerCase();
        });

        if (effect) return effect.value;

        // 2. Compétence maîtrisée via master_skill : rang 5 entièrement gratuit
        const hasMasterEffect = activeEffects.some(e => {
            const effectiveType = (e as any).inferredEffectType || e.type;
            const effectiveTarget = e.target || (e as any).inferredTarget;

            return effectiveType === 'master_skill' &&
                effectiveTarget &&
                effectiveTarget.trim().toLowerCase() === normalizedSkillName;
        });

        // Backward compatibility for old masterSkillTarget field on traits
        const hasLegacyMasterEffect = [
            ...(data.page2?.avantages || []),
            ...(data.page2?.desavantages || [])
        ].some(trait =>
            trait.masterSkillTarget &&
            trait.masterSkillTarget.trim().toLowerCase() === normalizedSkillName
        );

        if (hasMasterEffect || hasLegacyMasterEffect) return 5;

        return 0;
    };

    // Calcul des bonus XP via Formules
    const xpFormulaEffects = activeEffects.filter(e => {
        const effectiveType = (e as any).inferredEffectType || e.type;
        const effectiveTarget = e.target || (e as any).inferredTarget;
        return (effectiveType === 'formula' || effectiveType === 'xp_bonus') &&
            effectiveTarget && effectiveTarget.trim().toUpperCase() === 'XP';
    });

    const scenarioLogs = (data.xpLogs || []).filter(log =>
        log.countsAsScenario !== undefined
            ? log.countsAsScenario
            : (log.amount > 0 || (log.scenario && log.scenario.trim() !== ''))
    );
    const scenarioCount = scenarioLogs.length;

    let totalTraitXP = 0;
    const formulaBonusBreakdown: ExperienceBreakdownItem[] = [];

    xpFormulaEffects.forEach(e => {
        // Resolve formula string: already enriched by getActiveTraitEffects
        const formulaString = e.formula;

        if (!formulaString) {
            logger.warn(`Formula string empty for XP effect from ${e.source}`);
            return;
        }

        try {
            const result = evaluateFormula(formulaString, data, {
                traitLevel: e.traitLevel,
                scenariosCount: scenarioCount
            });

            if (result !== 0) {
                // Operator is already in e (either from trait or enriched from global)
                const operator = e.operator || 'ADD';

                if (operator === 'SET') {
                    // Logic for SET in XP gain is tricky, we treat it as "at least this amount" or "reset to this"
                    // but for XP bonus it's usually incremental.
                    // For now, let's just make it additive to not break history, but log correctly.
                    totalTraitXP += result;
                } else if (operator === 'SUB') {
                    totalTraitXP -= result;
                } else {
                    totalTraitXP += result;
                }

                formulaBonusBreakdown.push({
                    name: `Bonus : ${e.source || 'Trait'}`,
                    amount: operator === 'SUB' ? -result : result
                });
            }
        } catch (err) {
            logger.error(`Error calculating XP formula for trait ${e.source}:`, err);
        }
    });

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
    const tooltip = `Total : ${totalGain} XP\n\nBase (Historique) : ${gainFromLogs}`;

    if (totalTraitXP > 0) {
        gainDisplay += ` (+${totalTraitXP})`;
    }

    return {
        gain: gainDisplay,
        gainTooltip: tooltip,
        spent: totalSpent.toString(),
        rest: (totalGain - totalSpent).toString(),
        breakdown: {
            gains: [...baseGainsBreakdown, ...formulaBonusBreakdown],
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
function getActiveTraitEffects(data: CharacterSheetData, rules?: RulesData): ActiveEffect[] {
    const activeEffects: ActiveEffect[] = [];

    const globalTraits = rules?.libraries?.traits || [];
    const globalTraitMap = new Map(globalTraits.map(t => [normalizeString(t.name), t]));

    const findEffects = (traitName: string, traitLevel: number) => {
        if (!traitName) return;
        const normalizedName = normalizeString(traitName);

        // helper to enrich effect with global formula data
        const enrichEffect = (e: TraitEffect, source: string): ActiveEffect => {
            const active: any = { ...e, source, traitLevel };
            if (e.formulaId && rules?.libraries?.formulas) {
                const global = rules.libraries.formulas.find(f => f.id === e.formulaId);
                if (global) {
                    if (global.target) active.inferredTarget = global.target;
                    if (global.effectType) active.inferredEffectType = global.effectType;
                    if (global.formula) active.formula = global.formula;
                    if (global.operator && !active.operator) active.operator = global.operator;
                }
            }
            return active;
        };

        // 1. Recherche Local
        const localEntry = data.library?.find(l => normalizeString(l.name) === normalizedName);
        if (localEntry && localEntry.effects && localEntry.effects.length > 0) {
            localEntry.effects.forEach(e => activeEffects.push(enrichEffect(e, localEntry.name)));
            return;
        }

        // 2. Recherche Global
        const globalEntry = globalTraitMap.get(normalizedName);
        if (globalEntry && globalEntry.effects && globalEntry.effects.length > 0) {
            globalEntry.effects.forEach(e => activeEffects.push(enrichEffect(e, globalEntry.name)));
        }
    };

    data.page2?.avantages?.forEach(t => findEffects(t.name, parseInt(t.value?.toString() || '1') || 1));
    data.page2?.desavantages?.forEach(t => findEffects(t.name, parseInt(t.value?.toString() || '1') || 1));
    return activeEffects;
}
