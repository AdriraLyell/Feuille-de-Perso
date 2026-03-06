import { CharacterSheetData } from '../../types';
import { RulesData, SkillCategoryConfig, SkillBehavior, RulesCardConfig } from '../../types/rules';
import { INITIAL_DATA } from '../../data/initialState';
import { logger } from '../logger';

// Import migration modules
import { MIGRATIONS, CURRENT_SCHEMA_VERSION, MigratableData } from './registry';
import { generateId } from '../factories';
import { LEGACY_SKILL_MAP } from './migrateSkills';
import { migrateAttributeId as migrateAttributeIdBase } from './migrateAttributes';

/**
 * Main migration function for character sheet data.
 * Applies migrations in sequence based on schema version.
 */
export const migrateData = (parsed: MigratableData): CharacterSheetData => {

    // Default to version 0 if _schemaVersion is missing (Legacy data)
    const currentVersion = (parsed._schemaVersion as number) || 0;

    // If up to date, ensure we still clean up and repair
    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
        repairAndCleanupData(parsed);
        return parsed as CharacterSheetData;
    }

    // Deep copy to prevent mutating the original until success
    const migrated = JSON.parse(JSON.stringify(parsed)) as MigratableData;
    let migrationsApplied = 0;
    const failedSteps: { version: number, index: number, error: string }[] = [];

    // Apply migrations sequentially from current+1 to latest
    for (let v = currentVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
        const steps = MIGRATIONS[v];
        if (steps && steps.length > 0) {
            steps.forEach((step, i) => {
                try {
                    step(migrated);
                } catch (e) {
                    logger.error(`[Migration] Failed to apply migration step in v${v} (index ${i}):`, e);
                    failedSteps.push({
                        version: v,
                        index: i,
                        error: e instanceof Error ? e.message : String(e)
                    });
                }
            });

            // Only update schema version if ALL steps for this version passed
            if (failedSteps.length === 0) {
                migrated._schemaVersion = v;
                migrationsApplied++;
            } else {
                // Stop migration if a step fails to avoid inconsistent data state
                break;
            }
        }
    }

    if (failedSteps.length > 0) {
        migrated._migrationFailures = failedSteps;
        logger.warn(`[Migration] Data migration completed with ${failedSteps.length} failures. Schema version stayed at ${migrated._schemaVersion}`);
    } else if (migrationsApplied > 0) {
        logger.log(`[Migration] Successfully migrated data from v${currentVersion} to v${CURRENT_SCHEMA_VERSION}`);
    }

    // NEW: Post-migration cleanup and repair
    repairAndCleanupData(migrated);

    return migrated as unknown as CharacterSheetData;
};

/**
 * Idempotent repair and cleanup function.
 * - Converts 'null' properties to 'undefined' (Zod compatibility)
 * - Ensures mandatory structures (counters, etc.)
 * - Repairs legacy effect types that might have bypassed versioned migrations
 */
const repairAndCleanupData = (obj: MigratableData): void => {
    if (!obj || typeof obj !== 'object') return;

    // 1. Recursive Null Cleanup
    const cleanupNullsRecursive = (item: unknown) => {
        if (!item || typeof item !== 'object') return;
        if (Array.isArray(item)) {
            item.forEach(cleanupNullsRecursive);
            return;
        }
        const record = item as Record<string, unknown>;
        Object.keys(record).forEach(key => {
            const val = record[key];
            if (val === null) {
                delete record[key];
            } else if (typeof val === 'object') {
                cleanupNullsRecursive(val);
            }
        });
    };
    cleanupNullsRecursive(obj);

    // 2. Mandatory Structure Repair
    const record = obj as Record<string, unknown>;
    if (!record.counters) record.counters = { custom: [] };
    
    const counters = record.counters as Record<string, unknown>;
    if (!counters.volonte) counters.volonte = { id: 'volonte', name: 'Volonté', value: 3, creationValue: 3, max: 10, current: 0 };
    if (!counters.confiance) counters.confiance = { id: 'confiance', name: 'Confiance', value: 3, creationValue: 3, max: 10, current: 0 };
    if (!Array.isArray(counters.custom)) counters.custom = [];

    // 3. Effect Types Repair (Idempotent migrateFormulas)
    const VALID_EFFECT_TYPES = ['free_skill_rank', 'master_skill', 'block_skill_increase', 'formula'];
    const repairEffects = (entry: unknown) => {
        const e = entry as { effects?: Array<{ type: string; value?: unknown; method?: string; formula?: string; target?: string }> };
        if (e && Array.isArray(e.effects)) {
            e.effects.forEach((effect) => {
                if (!effect) return;
                if (!VALID_EFFECT_TYPES.includes(effect.type)) {
                    // Migrate legacy or invalid type to formula
                    if (effect.type === 'attribute_bonus' || effect.type === 'counter_max_bonus' || effect.type === 'xp_bonus') {
                        const legacyType = effect.type;
                        effect.type = 'formula';
                        if (legacyType === 'attribute_bonus') {
                            effect.formula = String(effect.value || '0');
                        } else if (legacyType === 'counter_max_bonus') {
                            effect.formula = `${String(effect.value || 0)} * TRAIT_LEVEL`;
                        } else if (legacyType === 'xp_bonus') {
                            effect.target = 'XP';
                            effect.formula = effect.method === 'per_scenario' ? `${String(effect.value || 0)} * SCENARIOS_COUNT` : String(effect.value || '0');
                            delete effect.method;
                        }
                        delete effect.value;
                    } else {
                        // Unknown type, fallback to formula with value 0 to avoid crash
                        effect.type = 'formula';
                        effect.formula = '0';
                        logger.warn(`Unknown effect type repaired: ${effect.type}`);
                    }
                }
            });
        }
    };

    if (Array.isArray(record.library)) record.library.forEach(repairEffects);
    if (record.page2) {
        const p2 = record.page2 as Record<string, unknown>;
        if (Array.isArray(p2.avantages)) p2.avantages.forEach(repairEffects);
        if (Array.isArray(p2.desavantages)) p2.desavantages.forEach(repairEffects);
    }
};

/**
 * Migration function for rules data (v2 format).
 * Converts legacy skill category IDs and ensures proper structure.
 */
export const migrateRulesToV2 = (rulesRaw: unknown): RulesData | null => {
    if (!rulesRaw) return null;
    const rules = rulesRaw as Record<string, unknown>;

    const behaviorMap: Record<string, SkillBehavior> = {
        'Col_Comp_1': 'Comp\u00e9tence',
        'Col_Comp_2': 'Comp\u00e9tence',
        'Col_Comp_3': 'Comp\u00e9tence',
        'Col_Comp_4': 'Comp\u00e9tence',
        'Col_Comp_5': 'Secondaire',
        'Col_Comp_6': 'Secondaire',
        'Col_Comp_7': 'Secondaire',
        'Col_Comp_8': 'Arrière-plan',
        'Col_Comp_9': 'Compteur'
    };

    // 1. Ensure Definitions exist
    if (!rules.definitions) rules.definitions = {};
    const definitions = rules.definitions as Record<string, unknown>;

    // 2. Migrate skillCategories if missing
    if (!definitions.skillCategories || !Array.isArray(definitions.skillCategories) || definitions.skillCategories.length === 0) {
        const labels = (definitions.labels as Record<string, string>) || {};
        const categories: SkillCategoryConfig[] = [];

        Object.entries(LEGACY_SKILL_MAP).forEach(([oldKey, newId]) => {
            const label = (labels[oldKey] || labels[newId] || oldKey.charAt(0).toUpperCase() + oldKey.slice(1)) as string;
            const behavior = (behaviorMap[newId] || 'Comp\u00e9tence') as SkillBehavior;
            const factor = behavior === 'Secondaire' ? 0.5 : 1;
            const type: 'linear' | 'triangular' = (behavior === 'Arrière-plan' || behavior === 'Compteur') ? 'linear' : 'triangular';

            categories.push({
                id: newId,
                label: label,
                behavior: behavior,
                description: "",
                allowSpecializations: behavior === 'Comp\u00e9tence',
                costConfig: { factor, type }
            });
        });

        categories.sort((a, b) => a.id.localeCompare(b.id));
        definitions.skillCategories = categories;
    }

    // 3. Migrate definitions.skills Record keys
    if (definitions.skills) {
        const oldSkills = definitions.skills as Record<string, string[]>;
        const newSkills: Record<string, string[]> = {};
        Object.keys(oldSkills).forEach(oldKey => {
            const newKey = LEGACY_SKILL_MAP[oldKey] || oldKey;
            newSkills[newKey] = oldSkills[oldKey];
        });
        definitions.skills = newSkills;
    }

    // 4. Migrate definitions.attributes Record keys
    if (definitions.attributes) {
        const oldAttrs = definitions.attributes as Record<string, string[]>;
        const newAttrs: Record<string, string[]> = {};
        Object.keys(oldAttrs).forEach(oldKey => {
            const newKey = migrateAttributeIdBase(oldKey);
            newAttrs[newKey] = oldAttrs[oldKey];
        });
        definitions.attributes = newAttrs;
    }

    // 5. Migrate definitions.secondaryAttributes Record keys
    if (definitions.secondaryAttributes) {
        const oldSecAttrs = definitions.secondaryAttributes as Record<string, string[]>;
        const newSecAttrs: Record<string, string[]> = {};
        Object.keys(oldSecAttrs).forEach(oldKey => {
            const newKey = migrateAttributeIdBase(oldKey);
            newSecAttrs[newKey] = oldSecAttrs[oldKey] || [];
        });
        definitions.secondaryAttributes = newSecAttrs;
    }

    // 6. Migrate definitions.labels Record keys
    if (definitions.labels) {
        const oldLabels = definitions.labels as Record<string, string>;
        const newLabels: Record<string, string> = {};
        Object.keys(oldLabels).forEach(oldKey => {
            let newKey = LEGACY_SKILL_MAP[oldKey] || oldKey;
            newKey = migrateAttributeIdBase(newKey);
            newLabels[newKey] = oldLabels[oldKey];
        });
        definitions.labels = newLabels;
    }

    // 7. Ensure configurations structure
    if (!rules.configurations) {
        rules.configurations = {
            global: { maxAttributeScore: 5, maxSkillScore: 10, secondaryAttributes: false },
            creation: INITIAL_DATA.creationConfig,
            xpCosts: { attributeFactor: 6, skillFactor: 1, specializationFactor: 0 },
            cards: {
                ...INITIAL_DATA.creationConfig.cardConfig,
                ranks: [],
                counts: [],
                maxLabel: 'Max'
            }
        };
    } else {
        const configs = rules.configurations as Record<string, unknown>;
        if (!configs.global) configs.global = { maxAttributeScore: 5, maxSkillScore: 10 };
        if (!configs.creation) configs.creation = INITIAL_DATA.creationConfig;
        if (!configs.xpCosts) {
            configs.xpCosts = {
                attributeFactor: 6,
                skillFactor: 1,
                specializationFactor: 0
            };
        }
        const creation = configs.creation as Record<string, unknown> | undefined;
        if (!configs.cards && creation && creation.cardConfig) {
            const legacyConfig = creation.cardConfig as Partial<RulesCardConfig>;
            configs.cards = {
                active: legacyConfig.active ?? true,
                baseStart: legacyConfig.baseStart ?? 2,
                increment: legacyConfig.increment ?? 0.5,
                bestSkillsCount: legacyConfig.bestSkillsCount ?? 6,
                ranks: legacyConfig.ranks || [],
                counts: legacyConfig.counts || [],
                maxLabel: legacyConfig.maxLabel || ''
            };
        }
    }

    // 8. Ensure libraries structure
    if (!rules.libraries) {
        rules.libraries = {
            traits: [],
            skills: [],
            specializations: [],
            backgrounds: [],
            counters: [],
            mysticAbilities: []
        };
    } else {
        const libs = rules.libraries as Record<string, unknown>;
        if (!libs.traits) libs.traits = [];
        if (!libs.skills) libs.skills = [];
        if (!libs.specializations) libs.specializations = [];
        if (!libs.backgrounds) libs.backgrounds = [];
        if (!libs.counters) libs.counters = [];
        if (!libs.mysticAbilities || (Array.isArray(libs.mysticAbilities) && libs.mysticAbilities.length === 0)) {
            const defaults = INITIAL_DATA.mysticAbilities || [];
            libs.mysticAbilities = defaults.map((d) => ({ ...d }));
        }
    }

    const libs = rules.libraries as Record<string, unknown[]>;
    const defs = rules.definitions as Record<string, unknown>;

    // Populate backgrounds from definitions
    if (libs.backgrounds.length === 0 && Array.isArray(defs.backgrounds)) {
        libs.backgrounds = (defs.backgrounds as string[]).map((bg: string) => ({
            id: bg.toLowerCase().replace(/\s+/g, '_'),
            name: bg,
            description: "",
            cost: 1
        }));
    }

    // Populate counters from definitions
    if (libs.counters.length === 0 && defs.counters) {
        libs.counters = Object.values(defs.counters as Record<string, { id: string, name: string, max: number, xpCost: number }>).map((c) => ({
            id: c.id,
            name: c.name,
            description: "",
            defaultMax: c.max,
            xpCost: c.xpCost
        }));
    }

    // 9. Migrate formulas in traits
    if (Array.isArray(libs.traits)) {
        if (!libs.formulas) libs.formulas = [];

        libs.traits.forEach((traitRaw) => {
            const trait = traitRaw as Record<string, unknown>;
            if (trait && Array.isArray(trait.effects)) {
                trait.effects.forEach((effectRaw) => {
                    const effect = effectRaw as Record<string, unknown>;
                    if (!effect) return;
                    const isLegacy = ['attribute_bonus', 'counter_max_bonus', 'xp_bonus'].includes(effect.type as string);
                    const isOrphanFormula = effect.type === 'formula' && !effect.formulaId && effect.formula;

                    if (isLegacy || isOrphanFormula) {
                        let formulaString = (effect.formula as string) || '';
                        let target = effect.target;

                        if (isLegacy) {
                            if (effect.type === 'attribute_bonus') {
                                formulaString = String(effect.value || '0');
                            } else if (effect.type === 'counter_max_bonus') {
                                formulaString = `${String(effect.value || 0)} * TRAIT_LEVEL`;
                            } else if (effect.type === 'xp_bonus') {
                                target = 'XP';
                                if (effect.method === 'per_scenario') {
                                    formulaString = `${String(effect.value || 0)} * SCENARIOS_COUNT`;
                                } else {
                                    formulaString = String(effect.value || '0');
                                }
                            }
                        }

                        if (!formulaString) return;

                        let existing = (libs.formulas as Record<string, unknown>[]).find((f) => f.formula === formulaString);

                        if (!existing) {
                            existing = {
                                id: generateId(),
                                name: `Mécanique: ${trait.name}`,
                                type: 'modifier',
                                formula: formulaString,
                                isActive: true,
                                isGlobal: true,
                                description: `Importé depuis le trait ${trait.name}`
                            };
                            (libs.formulas as Record<string, unknown>[]).push(existing);
                        }

                        effect.type = 'formula';
                        effect.formula = formulaString;
                        effect.formulaId = existing.id;
                        effect.target = target;
                        delete effect.value;
                        delete effect.method;
                    }
                });
            }
        });
    }

    return rules as unknown as RulesData;
};

// Re-export for backward compatibility
export { LEGACY_SKILL_MAP } from './migrateSkills';
export { ATTRIBUTE_ID_MAP, migrateAttributeId } from './migrateAttributes';
