import { DatabaseService } from '../../services/DatabaseService';
import { supabase } from '../../services/supabase';
import { RulesData } from '../../types/rules';
import { LIBRARY_TYPE_CONFIG } from '../../constants/db';

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
                    // Default categories for skills/backgrounds/counters/mysticAbilities
                    if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds' || typeCfg.key === 'counters' || typeCfg.key === 'mysticAbilities') {
                        link.default_category = item.defaultCategory;
                    }
                    toLink.push(link);
                } else {
                    // Create as global
                    const payload: any = {
                        id: item.id,
                        name: item.name,
                        code: item.code,
                        description: item.description,
                        setting_id: null
                    };

                    // Add type-specific fields
                    if (typeCfg.key === 'traits') {
                        payload.type = item.type;
                        payload.cost = item.cost || '0';
                        payload.points_label = item.pointsLabel || item.cost;
                        payload.is_variable_cost = item.isVariableCost || false;
                        payload.tags = item.tags || [];
                        payload.is_variable = item.isVariable;
                        payload.has_auto_counter = item.hasAutoCounter;
                        payload.auto_counter_name = item.autoCounterName;
                        payload.is_xp_upgradeable = item.isXPUpgradeable;
                        payload.effects = item.effects || [];
                    } else if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds') {
                        payload.is_variable = item.isVariable;
                        if (typeCfg.key === 'skills') payload.mystic_ability_id = item.mysticAbilityId;
                    } else if (typeCfg.key === 'mysticAbilities') {
                        payload.is_variable = item.isVariable;
                        payload.default_category = item.defaultCategory;
                    } else if (typeCfg.key === 'counters') {
                        payload.max_value = item.maxValue;
                        payload.default_value = item.defaultValue;
                        payload.xp_cost = item.xpCost;
                        payload.formula_id = item.formulaId || null;
                    } else if (typeCfg.key === 'specializations') {
                        payload.skill_ids = item.skillIds;
                        payload.default_min_level = item.defaultMinLevel;
                    } else if (typeCfg.key === 'formulas') {
                        payload.formula = item.formula;
                        payload.type = item.type;
                        payload.target = item.target;
                        payload.effect_type = item.effectType;
                        payload.aggregate_config = item.aggregateConfig;
                        payload.operator = item.operator;
                        payload.force_variant = !!item.forceVariant;
                    }

                    toCreate.push(payload);
                    const link: any = { setting_id: settingId, [typeCfg.idKey]: item.id, is_active: true };
                    if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds' || typeCfg.key === 'counters' || typeCfg.key === 'mysticAbilities') {
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

            // 0. Track current linked items to detect deletions
            const { data: oldLinks } = await supabase.from(typeCfg.rel).select(typeCfg.idKey).eq('setting_id', settingId);
            const oldIds = new Set<string>(oldLinks?.map((l: any) => l[typeCfg.idKey]) || []);

            // 1. UPSERT Global Repository items
            for (const item of currentItems) {
                const payload: any = {
                    id: item.id, // Mandatory for upsert
                    name: item.name,
                    code: item.code,
                    description: item.description,
                    setting_id: null // Ensure it's marked as Global in the repository
                };

                if (typeCfg.key === 'traits') {
                    payload.type = item.type;
                    payload.cost = item.cost || '0';
                    payload.points_label = item.pointsLabel || item.cost;
                    payload.is_variable_cost = item.isVariableCost || false;
                    payload.tags = item.tags;
                    payload.is_variable = item.isVariable;
                    payload.has_auto_counter = item.hasAutoCounter;
                    payload.auto_counter_name = item.autoCounterName;
                    payload.is_xp_upgradeable = item.isXPUpgradeable;
                    payload.effects = item.effects;
                } else if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds') {
                    payload.is_variable = !!item.isVariable;
                    if (typeCfg.key === 'skills') {
                        // SURGICAL: If it's a customization in a setting, do not overwrite global mystic link
                        if (item.isCustomized && settingId) {
                            // We skip upserting the global entry if it's already there and we are only customizing locally.
                            // If it's a new item (no ID or not in DB), we might still want to create it?
                            // But usually customized means it exists.
                            // Let's check if it's global.
                            if (item.isGlobal) {
                                // Skip global upsert for modified global items to protect the library
                                continue;
                            }
                        }
                        payload.mystic_ability_id = item.mysticAbilityId || null;
                    }
                } else if (typeCfg.key === 'mysticAbilities') {
                    payload.is_variable = item.isVariable;
                    payload.default_category = item.defaultCategory;
                } else if (typeCfg.key === 'counters') {
                    payload.max_value = item.maxValue;
                    payload.default_value = item.defaultValue;
                    payload.xp_cost = item.xpCost;
                    payload.formula_id = item.formulaId || null;
                } else if (typeCfg.key === 'specializations') {
                    payload.skill_ids = item.skillIds;
                    payload.default_min_level = item.defaultMinLevel;
                } else if (typeCfg.key === 'formulas') {
                    payload.formula = item.formula;
                    payload.type = item.type;
                    payload.target = item.target;
                    payload.effect_type = item.effectType;
                    payload.aggregate_config = item.aggregateConfig;
                    payload.operator = item.operator;
                    payload.force_variant = !!item.forceVariant;
                }

                // Use UPSERT instead of update to handle newly created items from the UI
                await DatabaseService.upsert(typeCfg.table, payload, {}, `LibraryPersistence.sync.${typeCfg.key}.upsertGlobal`);
            }

            // 2. Refresh RELATIONSHIPS (Preserve all library items in linked state for this campaign)
            await DatabaseService.deleteBy(typeCfg.rel, 'setting_id', settingId, `LibraryPersistence.sync.${typeCfg.key}.deleteLinks`);
            if (currentItems.length > 0) {
                const relPayload = currentItems.map((item: any) => {
                    const link: any = {
                        setting_id: settingId,
                        [typeCfg.idKey]: item.id,
                        is_active: item.isActive !== false
                    };
                    // Skills, backgrounds, counters and mystic abilities have default categories
                    if (typeCfg.key === 'skills' || typeCfg.key === 'backgrounds' || typeCfg.key === 'counters' || typeCfg.key === 'mysticAbilities') {
                        link.default_category = item.defaultCategory;
                    }

                    // SKILL OVERRIDES
                    if (typeCfg.key === 'skills' && item.isCustomized) {
                        link.name_override = item.name;
                        link.is_variable_override = !!item.isVariable;
                        link.mystic_ability_id_override = item.mysticAbilityId;
                        link.description_override = item.description;
                    }
                    return link;
                });
                await DatabaseService.insert(typeCfg.rel, relPayload, `LibraryPersistence.sync.${typeCfg.key}.insertLinks`);
            }

            // 3. Refresh VARIANTS (if applicable)
            if ('variants' in typeCfg && typeCfg.variants) {
                const variantsTable = typeCfg.variants as string;

                // A. Delete all LOCAL variants for this setting
                await DatabaseService.deleteBy(variantsTable, 'setting_id', settingId, `LibraryPersistence.sync.${typeCfg.key}.deleteVariants`);

                // B. Surgical cleanup for GLOBAL variants of the items we are processing
                const globalItemIds = currentItems
                    .filter((i: any) => i.isGlobal && !i.isCustomized)
                    .map((i: any) => i.id);

                if (globalItemIds.length > 0) {
                    await supabase.from(variantsTable)
                        .delete()
                        .in(typeCfg.idKey, globalItemIds)
                        .is('setting_id', null);
                }

                const variantsPayload: any[] = [];
                currentItems.forEach((item: any) => {
                    if (item.variants && item.variants.length > 0) {
                        const isGlobalItem = item.isGlobal && !item.isCustomized;
                        const targetSid = isGlobalItem ? null : settingId;

                        item.variants.forEach((v: string) => {
                            variantsPayload.push({
                                [typeCfg.idKey]: item.id,
                                setting_id: targetSid,
                                name: v
                            });
                        });
                    }
                });

                if (variantsPayload.length > 0) {
                    await DatabaseService.insert(variantsTable, variantsPayload, `LibraryPersistence.sync.${typeCfg.key}.insertVariants`);
                }
            }

            // 4. CLEANUP ORPHANS (Items removed from this campaign that are no longer used anywhere)
            const currentIds = new Set(currentItems.map((i: any) => i.id));
            const removedIds = [...oldIds].filter(id => !currentIds.has(id));

            if (removedIds.length > 0) {
                for (const rid of removedIds) {
                    // Check if still used by ANY other campaign
                    const { count: relCount } = await supabase
                        .from(typeCfg.rel)
                        .select('*', { count: 'exact', head: true })
                        .eq(typeCfg.idKey, rid);

                    if (!relCount || relCount === 0) {
                        // Additional check for mystic abilities (used as overrides or in master skill table)
                        if (typeCfg.key === 'mysticAbilities') {
                            const { count: skillLinkCount } = await supabase.from('libraries_skills').select('*', { count: 'exact', head: true }).eq('mystic_ability_id', rid);
                            const { count: overrideLinkCount } = await supabase.from('rel_setting_skills').select('*', { count: 'exact', head: true }).eq('mystic_ability_id_override', rid);
                            if (skillLinkCount === 0 && overrideLinkCount === 0) {
                                await DatabaseService.delete(typeCfg.table, rid, `LibraryPersistence.sync.${typeCfg.key}.deleteOrphan`);
                            }
                        } else {
                            await DatabaseService.delete(typeCfg.table, rid, `LibraryPersistence.sync.${typeCfg.key}.deleteOrphan`);
                        }
                    }
                }
            }
        }
    }
};
