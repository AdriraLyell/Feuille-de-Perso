import { supabase } from '../../services/supabase'; // Keep for selects until fully abstracted or use execute
import { DatabaseService } from '../../services/DatabaseService';
import { RulesData } from '../../types/rules';
import { LibraryEntry as LibraryTraitEntry } from '../../types/system';
import { LIBRARY_TYPE_CONFIG, LibraryTypeKey } from '../../constants/db';

export const LibraryPersistence = {
    /**
     * Persist initial libraries for a new setting
     */
    async persistInitialLibraries(settingId: string, initialRules: Partial<RulesData>) {
        if (!initialRules.libraries) return;

        for (const typeCfg of LIBRARY_TYPE_CONFIG) {
            const items = (initialRules.libraries as any)[typeCfg.key] || [];
            if (items.length === 0) continue;

            // Fetch existing globals to avoid duplicates
            const globals = await DatabaseService.fetchAll<{ id: string, name: string }>(typeCfg.table, {
                select: 'id, name',
                eq: { setting_id: null }
            }, `LibraryPersistence.persistInitial.${typeCfg.key}.globals`);

            const globalMap = new Map((globals || []).map(g => [g.name.trim().toLowerCase(), g.id]));
            const toCreate: any[] = [];
            const toLink: any[] = [];

            items.forEach((item: any) => {
                const normalized = item.name.trim().toLowerCase();
                const existingId = globalMap.get(normalized);

                if (existingId) {
                    const link: any = { setting_id: settingId, [typeCfg.idKey]: existingId, is_active: true };
                    // Default categories for skills/backgrounds/counters
                    if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds' || typeCfg.key === 'counters') {
                        link.default_category = item.defaultCategory;
                    }
                    toLink.push(link);
                } else {
                    // Create as global
                    const payload: any = {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        setting_id: null
                    };

                    // Add type-specific fields
                    if (typeCfg.key === 'traits') {
                        payload.type = item.type;
                        payload.cost = item.cost;
                        payload.tags = item.tags || [];
                        payload.is_variable = item.isVariable;
                        payload.effects = item.effects || [];
                    } else if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds') {
                        payload.is_variable = item.isVariable;
                        if (typeCfg.key === 'skills') payload.mystic_ability_id = item.mysticAbilityId;
                    } else if (typeCfg.key === 'mysticAbilities') {
                        payload.is_variable = item.isVariable;
                    } else if (typeCfg.key === 'counters') {
                        payload.max_value = item.maxValue;
                        payload.default_value = item.defaultValue;
                        payload.xp_cost = item.xpCost;
                    } else if (typeCfg.key === 'specializations') {
                        payload.skill_ids = item.skillIds;
                        payload.default_min_level = item.defaultMinLevel;
                    }

                    toCreate.push(payload);
                    const link: any = { setting_id: settingId, [typeCfg.idKey]: item.id, is_active: true };
                    if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds' || typeCfg.key === 'counters') {
                        link.default_category = item.defaultCategory;
                    }
                    toLink.push(link);
                }
            });

            if (toCreate.length > 0) await DatabaseService.insert(typeCfg.table, toCreate, `LibraryPersistence.persistInitial.${typeCfg.key}.create`);
            if (toLink.length > 0) await DatabaseService.insert(typeCfg.rel, toLink, `LibraryPersistence.persistInitial.${typeCfg.key}.links`);
        }
    },

    /**
     * Delete and Re-insert libraries (Standard Sync Strategy)
     */
    async syncLibraries(settingId: string, rules: RulesData) {
        for (const typeCfg of LIBRARY_TYPE_CONFIG) {
            const currentItems = (rules.libraries as any)[typeCfg.key] || [];

            // 1. UPSERT Global Repository items
            for (const item of currentItems) {
                const payload: any = {
                    id: item.id, // Mandatory for upsert
                    name: item.name,
                    description: item.description,
                    setting_id: null // Ensure it's marked as Global in the repository
                };

                if (typeCfg.key === 'traits') {
                    payload.type = item.type;
                    payload.cost = item.cost;
                    payload.tags = item.tags;
                    payload.is_variable = item.isVariable;
                    payload.effects = item.effects;
                } else if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds') {
                    payload.is_variable = item.isVariable;
                    if (typeCfg.key === 'skills') payload.mystic_ability_id = item.mysticAbilityId || null;
                } else if (typeCfg.key === 'mysticAbilities') {
                    payload.is_variable = item.isVariable;
                } else if (typeCfg.key === 'counters') {
                    payload.max_value = item.maxValue;
                    payload.default_value = item.defaultValue;
                    payload.xp_cost = item.xpCost;
                } else if (typeCfg.key === 'specializations') {
                    payload.skill_ids = item.skillIds;
                    payload.default_min_level = item.defaultMinLevel;
                }

                // Use UPSERT instead of update to handle newly created items from the UI
                await DatabaseService.upsert(typeCfg.table, payload, {}, `LibraryPersistence.sync.${typeCfg.key}.upsertGlobal`);
            }

            // 2. Refresh RELATIONSHIPS (Active/Local Preference)
            await DatabaseService.deleteBy(typeCfg.rel, 'setting_id', settingId, `LibraryPersistence.sync.${typeCfg.key}.deleteLinks`);
            const activeItems = currentItems.filter((i: any) => i.isActive !== false);
            if (activeItems.length > 0) {
                const relPayload = activeItems.map((item: any) => {
                    const link: any = {
                        setting_id: settingId,
                        [typeCfg.idKey]: item.id,
                        is_active: true
                    };
                    // Skills, backgrounds and counters have default categories
                    if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds' || typeCfg.key === 'counters') {
                        link.default_category = item.defaultCategory;
                    }
                    return link;
                });
                await DatabaseService.insert(typeCfg.rel, relPayload, `LibraryPersistence.sync.${typeCfg.key}.insertLinks`);
            }

            // 3. Refresh VARIANTS (if applicable)
            if ('variants' in typeCfg && typeCfg.variants) {
                const variantsTable = typeCfg.variants as string;
                await DatabaseService.deleteBy(variantsTable, 'setting_id', settingId, `LibraryPersistence.sync.${typeCfg.key}.deleteVariants`);
                const variantsPayload: any[] = [];
                currentItems.forEach((item: any) => {
                    if (item.variants && item.variants.length > 0) {
                        item.variants.forEach((v: string) => {
                            variantsPayload.push({
                                [typeCfg.idKey]: item.id,
                                setting_id: settingId,
                                name: v
                            });
                        });
                    }
                });
                if (variantsPayload.length > 0) {
                    await DatabaseService.insert(variantsTable, variantsPayload, `LibraryPersistence.sync.${typeCfg.key}.insertVariants`);
                }
            }
        }
    }
};
