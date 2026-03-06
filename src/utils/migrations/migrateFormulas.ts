import { MigratableData } from './registry';

/**
 * Migration: quantitative effects to formulas
 * 
 * Replaces 'attribute_bonus', 'counter_max_bonus', and 'xp_bonus'
 * with 'formula' generic type.
 */
export const migrateFormulas = (data: MigratableData) => {
    if (!data) return;

    if (Array.isArray(data.library)) {
        data.library.forEach((entryRaw: unknown) => {
            const entry = entryRaw as { effects?: unknown[] };
            if (entry && Array.isArray(entry.effects)) {
                entry.effects.forEach((effectRaw: unknown) => {
                    const effect = effectRaw as { 
                        type: string; 
                        value?: number | string; 
                        formula?: string; 
                        target?: string;
                        method?: string;
                    };
                    if (!effect) return;
                    if (effect.type === 'attribute_bonus') {
                        effect.type = 'formula';
                        effect.formula = effect.value?.toString() || '0';
                        delete effect.value;
                    } else if (effect.type === 'counter_max_bonus') {
                        effect.type = 'formula';
                        effect.formula = `${effect.value || 0} * TRAIT_LEVEL`;
                        delete effect.value;
                    } else if (effect.type === 'xp_bonus') {
                        effect.type = 'formula';
                        effect.target = 'XP';
                        if (effect.method === 'per_scenario') {
                            effect.formula = `${effect.value || 0} * SCENARIOS_COUNT`;
                        } else {
                            effect.formula = effect.value?.toString() || '0';
                        }
                        delete effect.value;
                        delete effect.method;
                    }
                });
            }
        });
    }
};
