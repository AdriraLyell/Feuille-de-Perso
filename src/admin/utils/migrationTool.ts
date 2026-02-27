
import { RulesData } from '../../types/rules';
import { LibraryEntry, TraitEffect, LibraryFormulaEntry } from '../../types';
import { generateId } from '../../utils/factories';

/**
 * Migration tool to move hardcoded trait effects to the new formula system.
 * Targets both Supabase (online) and JSON (offline).
 */
export const migrationTool = {
    /**
     * Migrates a library of traits by converting hardcoded effects (free_skill_rank, xp_bonus, etc.)
     * into formula-based effects, creating the corresponding formula entries.
     */
    migrateTraitsToFormulas: (rules: RulesData): { updatedRules: RulesData, stats: any } => {
        const stats = {
            traitsProcessed: 0,
            effectsMigrated: 0,
            formulasCreated: 0
        };

        const traits = rules.libraries?.traits || [];
        const formulas = [...(rules.libraries?.formulas || [])];

        const newTraits = traits.map((trait: any) => {
            if (!trait.effects || trait.effects.length === 0) return trait;

            stats.traitsProcessed++;
            const newEffects = trait.effects.map((effect: TraitEffect) => {
                // Skip if already a formula with a formulaId (already migrated or native)
                if (effect.type === 'formula' && effect.formulaId) return effect;

                // Identify if it's a legacy hardcoded effect
                let targetFormulaId = '';
                let formulaName = '';
                let formulaString = '';
                let effectType = '';
                let target = effect.target || '';

                if ((effect as any).type === 'free_skill_rank') {
                    formulaName = `Rang : ${effect.target}`;
                    formulaString = `${effect.value}`;
                    effectType = 'free_skill_rank';
                } else if ((effect as any).type === 'xp_bonus') {
                    formulaName = `Bonus XP : ${trait.name}`;
                    formulaString = `${effect.value}`;
                    target = 'XP';
                    effectType = 'xp_bonus';
                } else if ((effect as any).type === 'master_skill') {
                    formulaName = `Maîtrise : ${effect.target || trait.name}`;
                    formulaString = `5`;
                    effectType = 'master_skill';
                } else if ((effect as any).type === 'attribute_bonus') {
                    formulaName = `Bonus : ${effect.target}`;
                    formulaString = `${effect.value}`;
                    effectType = 'attribute_bonus';
                } else if (effect.type === 'formula' && (effect as any).formula && !effect.formulaId) {
                    formulaName = `Mécanique : ${trait.name}`;
                    formulaString = (effect as any).formula || '';
                    effectType = 'formula';
                    target = effect.target || '';
                }

                if (formulaName) {
                    // Smart operator detection
                    let operator: 'ADD' | 'SET' | 'SUB' = 'ADD';
                    if (effectType === 'master_skill') {
                        operator = 'SET';
                    } else if (formulaString.startsWith('-')) {
                        operator = 'SUB';
                        formulaString = formulaString.substring(1);
                    }
                    const existing = formulas.find(f => f.name === formulaName && f.formula === formulaString);
                    if (existing) {
                        targetFormulaId = existing.id;
                    } else {
                        // Create a new formula entry
                        const newFormula: LibraryFormulaEntry = {
                            id: `migrated_${generateId().slice(0, 8)}`,
                            name: formulaName,
                            formula: formulaString,
                            type: 'modifier',
                            target: target,
                            effectType: effectType as any,
                            description: `Migré depuis le trait: ${trait.name}`,
                            isActive: true,
                            isGlobal: true,
                            operator: operator
                        };
                        formulas.push(newFormula);
                        targetFormulaId = newFormula.id;
                        stats.formulasCreated++;
                    }

                    stats.effectsMigrated++;
                    return {
                        ...effect,
                        type: 'formula',
                        formulaId: targetFormulaId,
                        // We keep the old values for safety during transition but they won't be used by the new engine
                        value: 0
                    } as TraitEffect;
                }

                return effect;
            });

            return { ...trait, effects: newEffects };
        });

        return {
            updatedRules: {
                ...rules,
                libraries: {
                    ...rules.libraries,
                    traits: newTraits,
                    formulas: formulas
                }
            },
            stats
        };
    }
};
