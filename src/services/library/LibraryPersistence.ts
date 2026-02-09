import { supabase } from '../../services/supabase'; // Keep for selects until fully abstracted or use execute
import { DatabaseService } from '../../services/DatabaseService';
import { RulesData } from '../../types/rules';
import { LibraryEntry as LibraryTraitEntry } from '../../types/system';

export const LibraryPersistence = {
    /**
     * Persist initial libraries for a new setting
     */
    async persistInitialLibraries(settingId: string, initialRules: Partial<RulesData>) {
        if (!initialRules.libraries) return;

        const types = [
            { key: 'traits', table: 'libraries_traits', rel: 'rel_setting_traits', idKey: 'trait_id' },
            { key: 'skills', table: 'libraries_skills', rel: 'rel_setting_skills', idKey: 'skill_id', hasCat: true },
            { key: 'backgrounds', table: 'libraries_backgrounds', rel: 'rel_setting_backgrounds', idKey: 'background_id', hasCat: true },
            { key: 'counters', table: 'libraries_counters', rel: 'rel_setting_counters', idKey: 'counter_id', hasCat: true },
            { key: 'specializations', table: 'libraries_specializations', rel: 'rel_setting_specializations', idKey: 'specialization_id' }
        ];

        for (const type of types) {
            const items = (initialRules.libraries as any)[type.key] || [];
            if (items.length === 0) continue;

            // Fetch existing globals to avoid duplicates
            const globals = await DatabaseService.fetchAll<{ id: string, name: string }>(type.table, {
                select: 'id, name',
                eq: { setting_id: null }
            }, `LibraryPersistence.persistInitial.${type.key}.globals`);

            const globalMap = new Map((globals || []).map(g => [g.name.trim().toLowerCase(), g.id]));
            const toCreate: any[] = [];
            const toLink: any[] = [];

            items.forEach((item: any) => {
                const normalized = item.name.trim().toLowerCase();
                const existingId = globalMap.get(normalized);

                if (existingId) {
                    const link: any = { setting_id: settingId, [type.idKey]: existingId, is_active: true };
                    if (type.hasCat) link.default_category = item.defaultCategory;
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
                    if (type.key === 'traits') {
                        payload.type = item.type;
                        payload.cost = item.cost;
                        payload.tags = item.tags || [];
                        payload.is_variable = item.isVariable;
                        payload.effects = item.effects || [];
                    } else if (type.key === 'skills' || type.key === 'backgrounds') {
                        payload.is_variable = item.isVariable;
                    } else if (type.key === 'counters') {
                        payload.max_value = item.maxValue;
                        payload.default_value = item.defaultValue;
                        payload.xp_cost = item.xpCost;
                    } else if (type.key === 'specializations') {
                        payload.skill_ids = item.skillIds;
                        payload.default_min_level = item.defaultMinLevel;
                    }

                    toCreate.push(payload);
                    const link: any = { setting_id: settingId, [type.idKey]: item.id, is_active: true };
                    if (type.hasCat) link.default_category = item.defaultCategory;
                    toLink.push(link);
                }
            });

            if (toCreate.length > 0) await DatabaseService.insert(type.table, toCreate, `LibraryPersistence.persistInitial.${type.key}.create`);
            if (toLink.length > 0) await DatabaseService.insert(type.rel, toLink, `LibraryPersistence.persistInitial.${type.key}.links`);
        }
    },

    /**
     * Delete and Re-insert libraries (Standard Sync Strategy)
     */
    async syncLibraries(settingId: string, rules: RulesData) {
        const types = [
            { key: 'traits', table: 'libraries_traits', rel: 'rel_setting_traits', idKey: 'trait_id', variants: 'libraries_traits_variants' },
            { key: 'skills', table: 'libraries_skills', rel: 'rel_setting_skills', idKey: 'skill_id', variants: 'libraries_skills_variants', hasCat: true },
            { key: 'backgrounds', table: 'libraries_backgrounds', rel: 'rel_setting_backgrounds', idKey: 'background_id', variants: 'libraries_backgrounds_variants', hasCat: true },
            { key: 'counters', table: 'libraries_counters', rel: 'rel_setting_counters', idKey: 'counter_id', hasCat: false, hasCatRel: true },
            { key: 'specializations', table: 'libraries_specializations', rel: 'rel_setting_specializations', idKey: 'specialization_id' }
        ];

        for (const type of types) {
            const currentItems = (rules.libraries as any)[type.key] || [];

            // 1. UPSERT Global Repository items (updates name/desc/costs globally, but also CREATES them if new)
            for (const item of currentItems) {
                const payload: any = {
                    id: item.id, // Mandatory for upsert
                    name: item.name,
                    description: item.description,
                    setting_id: null // Ensure it's marked as Global in the repository
                };

                if (type.key === 'traits') {
                    payload.type = item.type;
                    payload.cost = item.cost;
                    payload.tags = item.tags;
                    payload.is_variable = item.isVariable;
                    payload.effects = item.effects;
                } else if (type.key === 'skills' || type.key === 'backgrounds') {
                    payload.is_variable = item.isVariable;
                } else if (type.key === 'counters') {
                    payload.max_value = item.maxValue;
                    payload.default_value = item.defaultValue;
                    payload.xp_cost = item.xpCost;
                } else if (type.key === 'specializations') {
                    payload.skill_ids = item.skillIds;
                    payload.default_min_level = item.defaultMinLevel;
                }

                // Use UPSERT instead of update to handle newly created items from the UI
                await DatabaseService.upsert(type.table, payload, {}, `LibraryPersistence.sync.${type.key}.upsertGlobal`);
            }

            // 2. Refresh RELATIONSHIPS (Active/Local Preference)
            await DatabaseService.deleteBy(type.rel, 'setting_id', settingId, `LibraryPersistence.sync.${type.key}.deleteLinks`);
            const activeItems = currentItems.filter((i: any) => i.isActive !== false);
            if (activeItems.length > 0) {
                const relPayload = activeItems.map((item: any) => {
                    const link: any = {
                        setting_id: settingId,
                        [type.idKey]: item.id,
                        is_active: true
                    };
                    if (type.hasCat || (type as any).hasCatRel) {
                        link.default_category = item.defaultCategory;
                    }
                    return link;
                });
                await DatabaseService.insert(type.rel, relPayload, `LibraryPersistence.sync.${type.key}.insertLinks`);
            }

            // 3. Refresh VARIANTS (if applicable)
            if (type.variants) {
                await DatabaseService.deleteBy(type.variants, 'setting_id', settingId, `LibraryPersistence.sync.${type.key}.deleteVariants`);
                const variantsPayload: any[] = [];
                currentItems.forEach((item: any) => {
                    if (item.variants && item.variants.length > 0) {
                        item.variants.forEach((v: string) => {
                            variantsPayload.push({
                                [type.idKey]: item.id,
                                setting_id: settingId,
                                name: v
                            });
                        });
                    }
                });
                if (variantsPayload.length > 0) {
                    await DatabaseService.insert(type.variants, variantsPayload, `LibraryPersistence.sync.${type.key}.insertVariants`);
                }
            }
        }
    }
};
