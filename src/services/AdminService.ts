
import { supabase } from './supabase';
import { RulesData } from '../types/rules';

export interface GameSettingSummary {
    id: string;
    name: string;
    version: string;
    last_updated: string;
    is_public: boolean;
}

export const AdminService = {

    /**
     * List all available settings (campagnes)
     */
    async listSettings(): Promise<GameSettingSummary[] | null> {
        const { data, error } = await supabase
            .from('game_settings')
            .select('id, name, version, last_updated, is_public')
            .order('last_updated', { ascending: false });

        if (error) {
            console.error('Error listing settings:', error);
            return null;
        }
        return data;
    },

    /**
     * Create a new empty setting
     */
    async createSetting(name: string, initialRules: Partial<RulesData>): Promise<string | null> {
        // Prepare JSONBs
        const configurations = initialRules.configurations || {};
        const definitions = initialRules.definitions || {};

        const { data, error } = await supabase
            .from('game_settings')
            .insert([{
                name,
                version: initialRules.version || '1.0.0',
                configurations,
                definitions,
                is_public: false
            }])
            .select('id')
            .single();

        if (error) {
            console.error('Error creating setting:', error);
            return null;
        }

        const settingId = data.id;

        // Persist Libraries if present
        if (initialRules.libraries) {
            try {
                // A. Traits
                if (initialRules.libraries.traits && initialRules.libraries.traits.length > 0) {
                    const traitsPayload = initialRules.libraries.traits.map(t => ({
                        setting_id: settingId,
                        ...t
                    }));
                    await supabase.from('libraries_traits').insert(traitsPayload);
                }

                // B. Skills (Enhanced: Link Global vs Create Local)
                if (initialRules.libraries.skills && initialRules.libraries.skills.length > 0) {
                    // 1. Fetch all Global Skills to check against
                    const { data: globalSkills } = await supabase
                        .from('libraries_skills')
                        .select('id, name')
                        .is('setting_id', null);

                    const globalSkillMap = new Map((globalSkills || []).map(s => [s.name.trim().toLowerCase(), s.id]));

                    const skillsPayload: any[] = [];
                    const linksPayload: any[] = [];

                    initialRules.libraries.skills.forEach(s => {
                        const normalizedName = s.name.trim().toLowerCase();
                        if (globalSkillMap.has(normalizedName)) {
                            // It's a global skill -> Link it
                            linksPayload.push({
                                setting_id: settingId,
                                skill_id: globalSkillMap.get(normalizedName),
                                is_active: true
                            });
                        } else {
                            // It's not global -> Create Local
                            skillsPayload.push({
                                setting_id: settingId,
                                ...s
                            });
                        }
                    });

                    if (skillsPayload.length > 0) {
                        await supabase.from('libraries_skills').insert(skillsPayload);
                    }

                    if (linksPayload.length > 0) {
                        await supabase.from('rel_setting_skills').insert(linksPayload);
                    }
                }

                // C. Specializations
                if (initialRules.libraries.specializations && initialRules.libraries.specializations.length > 0) {
                    const specsPayload = initialRules.libraries.specializations.map(s => ({
                        setting_id: settingId,
                        ...s
                    }));
                    await supabase.from('libraries_specializations').insert(specsPayload);
                }

                // D. Backgrounds (Unified)
                if (initialRules.libraries.backgrounds && initialRules.libraries.backgrounds.length > 0) {
                    const { data: globalBgs } = await supabase
                        .from('libraries_backgrounds')
                        .select('id, name')
                        .is('setting_id', null);

                    const globalBgMap = new Map((globalBgs || []).map(b => [b.name.trim().toLowerCase(), b.id]));
                    const bgPayload: any[] = [];
                    const bgLinksPayload: any[] = [];

                    initialRules.libraries.backgrounds.forEach(b => {
                        const normalizedName = b.name.trim().toLowerCase();
                        if (globalBgMap.has(normalizedName)) {
                            bgLinksPayload.push({
                                setting_id: settingId,
                                background_id: globalBgMap.get(normalizedName),
                                is_active: true
                            });
                        } else {
                            bgPayload.push({
                                setting_id: settingId,
                                ...b
                            });
                        }
                    });

                    if (bgPayload.length > 0) await supabase.from('libraries_backgrounds').insert(bgPayload);
                    if (bgLinksPayload.length > 0) await supabase.from('rel_setting_backgrounds').insert(bgLinksPayload);
                }

                // E. Counters (Unified)
                if (initialRules.libraries.counters && initialRules.libraries.counters.length > 0) {
                    const { data: globalCounters } = await supabase
                        .from('libraries_counters')
                        .select('id, name')
                        .is('setting_id', null);

                    const globalCounterMap = new Map((globalCounters || []).map(c => [c.name.trim().toLowerCase(), c.id]));
                    const counterPayload: any[] = [];
                    const counterLinksPayload: any[] = [];

                    initialRules.libraries.counters.forEach(c => {
                        const normalizedName = c.name.trim().toLowerCase();
                        if (globalCounterMap.has(normalizedName)) {
                            counterLinksPayload.push({
                                setting_id: settingId,
                                counter_id: globalCounterMap.get(normalizedName),
                                is_active: true
                            });
                        } else {
                            counterPayload.push({
                                setting_id: settingId,
                                id: c.id,
                                name: c.name,
                                max_value: c.maxValue,
                                default_value: c.defaultValue,
                                xp_cost: c.xpCost
                            });
                        }
                    });

                    if (counterPayload.length > 0) await supabase.from('libraries_counters').insert(counterPayload);
                    if (counterLinksPayload.length > 0) await supabase.from('rel_setting_counters').insert(counterLinksPayload);
                }
            } catch (libError) {
                console.error("Error persisting initial libraries:", libError);
                // We don't fail the whole creation, but we warn
            }
        }

        return settingId;
    },

    /**
     * Load a full setting by ID (including Libraries if we normalize them later, 
     * but for now we assume they might be in configurations or fetched separately)
     * For migration step 1: We treat libraries as mostly part of the global rules object structure 
     * BUT wait, our schema normalized them. So we must fetch them.
     */
    async loadSetting(id: string): Promise<RulesData | null> {
        // 1. Fetch Main Config
        const { data: setting, error: settingError } = await supabase
            .from('game_settings')
            .select('*')
            .eq('id', id)
            .single();

        if (settingError || !setting) {
            console.error('Error loading setting:', settingError);
            return null;
        }

        // 2. Fetch Libraries (Parallel)
        // For Skills, we need Global (setting_id IS NULL) AND Local (setting_id = id)
        // AND the selection status from rel_setting_skills

        const [traitsRes, skillsRes, specsRes, relSkillsRes, bgsRes, relBgsRes, countersRes, relCountersRes] = await Promise.all([
            // Traits: Legacy behavior (Local only for now, or naive) -> Keeping Local as per strict plan for now? 
            // Wait, plan only mentioned Skills.
            supabase.from('libraries_traits').select('*').eq('setting_id', id),

            // Skills: Fetch ALL (Global + Local)
            supabase.from('libraries_skills').select('*').or(`setting_id.eq.${id},setting_id.is.null`),

            // Specs
            supabase.from('libraries_specializations').select('*').eq('setting_id', id),

            // Relations (Active Global Skills)
            supabase.from('rel_setting_skills').select('skill_id').eq('setting_id', id),

            // Backgrounds: Global + Local
            supabase.from('libraries_backgrounds').select('*').or(`setting_id.eq.${id},setting_id.is.null`),
            // Background Selection
            supabase.from('rel_setting_backgrounds').select('background_id').eq('setting_id', id),

            // Counters: Global + Local
            supabase.from('libraries_counters').select('*').or(`setting_id.eq.${id},setting_id.is.null`),
            // Counter Selection
            supabase.from('rel_setting_counters').select('counter_id').eq('setting_id', id)
        ]);

        const activeSkillIds = new Set((relSkillsRes.data || []).map((r: any) => r.skill_id));
        const activeBgIds = new Set((relBgsRes.data || []).map((r: any) => r.background_id));
        const activeCounterIds = new Set((relCountersRes.data || []).map((r: any) => r.counter_id));

        // Helper to map DB snake_case to TS camelCase
        const mapTrait = (t: any): any => ({
            id: t.id,
            type: t.type,
            name: t.name,
            cost: t.cost,
            description: t.description,
            tags: t.tags || [],
            isVariable: t.is_variable,
            effects: t.effects || []
        });

        const mapSkill = (s: any, activeIds: Set<string>): any => ({
            id: s.id,
            name: s.name,
            description: s.description,
            defaultCategory: s.default_category,
            isVariable: s.is_variable,
            isGlobal: s.setting_id === null,
            isActive: activeIds.has(s.id) || s.setting_id === id // Locals are always active
        });

        const mapSpec = (s: any): any => ({
            id: s.id,
            name: s.name,
            description: s.description,
            skillIds: s.skill_ids || [],
            defaultMinLevel: s.default_min_level
        });

        const mapBg = (b: any, activeIds: Set<string>): any => ({
            id: b.id,
            name: b.name,
            description: b.description,
            isVariable: b.is_variable,
            isGlobal: b.setting_id === null,
            isActive: activeIds.has(b.id) || b.setting_id === id
        });

        const mapCounter = (c: any, activeIds: Set<string>): any => ({
            id: c.id,
            name: c.name,
            maxValue: c.max_value,
            defaultValue: c.default_value,
            xpCost: c.xp_cost,
            isGlobal: c.setting_id === null,
            isActive: activeIds.has(c.id) || c.setting_id === id
        });


        // Construct the full object
        const rules: RulesData = {
            version: setting.version,
            lastUpdated: new Date(setting.last_updated).getTime(),
            // @ts-ignore
            configurations: setting.configurations,
            // @ts-ignore
            definitions: setting.definitions,
            // @ts-ignore
            theme: setting.configurations.theme || { creationColor: "#000", xpColor: "#000" },
            libraries: {
                traits: (traitsRes.data || []).map(mapTrait),
                skills: (() => {
                    // Dedup logic: Local overrides Global by Name
                    const mappedGlobals = (skillsRes.data || [])
                        .filter(s => s.setting_id === null)
                        .map(s => mapSkill(s, activeSkillIds));

                    const mappedLocals = (skillsRes.data || [])
                        .filter(s => s.setting_id === id)
                        .map(s => mapSkill(s, activeSkillIds));

                    const skillMap = new Map<string, any>();

                    // 1. Add Globals
                    mappedGlobals.forEach(s => skillMap.set(s.name.trim().toLowerCase(), s));

                    // 2. Override with Locals
                    mappedLocals.forEach(s => skillMap.set(s.name.trim().toLowerCase(), s));

                    return Array.from(skillMap.values()).sort((a, b) => a.name.localeCompare(b.name));
                })(),
                specializations: (specsRes.data || []).map(mapSpec),
                backgrounds: (() => {
                    const mappedGlobals = (bgsRes.data || [])
                        .filter(b => b.setting_id === null)
                        .map(b => mapBg(b, activeBgIds));
                    const mappedLocals = (bgsRes.data || [])
                        .filter(b => b.setting_id === id)
                        .map(b => mapBg(b, activeBgIds));

                    const bgMap = new Map<string, any>();
                    mappedGlobals.forEach(b => bgMap.set(b.name.trim().toLowerCase(), b));
                    mappedLocals.forEach(b => bgMap.set(b.name.trim().toLowerCase(), b));

                    return Array.from(bgMap.values()).sort((a, b) => a.name.localeCompare(b.name));
                })(),
                counters: (() => {
                    const mappedGlobals = (countersRes.data || [])
                        .filter(c => c.setting_id === null)
                        .map(c => mapCounter(c, activeCounterIds));
                    const mappedLocals = (countersRes.data || [])
                        .filter(c => c.setting_id === id)
                        .map(c => mapCounter(c, activeCounterIds));

                    const cMap = new Map<string, any>();
                    mappedGlobals.forEach(c => cMap.set(c.name.trim().toLowerCase(), c));
                    mappedLocals.forEach(c => cMap.set(c.name.trim().toLowerCase(), c));

                    return Array.from(cMap.values()).sort((a, b) => a.name.localeCompare(b.name));
                })()
            }
        };

        return rules;
    },

    /**
     * Save/Update a setting
     * This is complex because we must save the root AND the libraries
     */
    async saveSetting(id: string, rules: RulesData, name?: string): Promise<{ success: boolean; message?: string }> {

        // 1. Update Root
        const rootUpdate: any = {
            version: rules.version,
            last_updated: new Date().toISOString(),
            configurations: rules.configurations,
            definitions: rules.definitions
        };
        if (name) rootUpdate.name = name;

        const { error: rootError } = await supabase
            .from('game_settings')
            .update(rootUpdate)
            .eq('id', id);

        if (rootError) {
            console.error("Failed to update root setting:", rootError);
            return { success: false, message: `Erreur MAJ Root: ${rootError.message}` };
        }

        // 2. Update Libraries (Naive Strategy: Delete All & Re-Insert)

        try {
            // A. Traits
            const { error: delTraitsErr } = await supabase.from('libraries_traits').delete().eq('setting_id', id);
            if (delTraitsErr) throw new Error("Delete Traits: " + delTraitsErr.message);

            if (rules.libraries.traits.length > 0) {
                const traitsPayload = rules.libraries.traits.map(t => ({
                    setting_id: id,
                    id: t.id,
                    type: t.type,
                    name: t.name,
                    cost: t.cost,
                    description: t.description,
                    tags: t.tags,
                    is_variable: t.isVariable,
                    effects: t.effects
                }));
                const { error: insTraitsErr } = await supabase.from('libraries_traits').insert(traitsPayload);
                if (insTraitsErr) throw new Error("Insert Traits: " + insTraitsErr.message);
            }

            // B. Skills Management (Enhanced for Global/Local)
            // 1. Identify Locals vs Globals in the incoming list
            const localSkillsToSave = rules.libraries.skills.filter(s => !s.isGlobal);
            const activeGlobalSkillIds = rules.libraries.skills
                .filter(s => s.isGlobal && s.isActive !== false) // Default to true if undefined
                .map(s => s.id);

            // 2. Sync Local Skills (Naive Replace for setting_id = id items)
            const { error: delSkillsErr } = await supabase.from('libraries_skills').delete().eq('setting_id', id);
            if (delSkillsErr) throw new Error("Delete Locals: " + delSkillsErr.message);

            if (localSkillsToSave.length > 0) {
                const skillsPayload = localSkillsToSave.map(s => ({
                    setting_id: id,
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    default_category: s.defaultCategory,
                    is_variable: s.isVariable
                }));
                const { error: insSkillsErr } = await supabase.from('libraries_skills').insert(skillsPayload);
                if (insSkillsErr) throw new Error("Insert Locals: " + insSkillsErr.message);
            }

            // 3. Sync Selection (rel_setting_skills)
            // Wipe existing selections for this setting
            const { error: delRelErr } = await supabase.from('rel_setting_skills').delete().eq('setting_id', id);
            if (delRelErr) throw new Error("Delete Selection: " + delRelErr.message);

            if (activeGlobalSkillIds.length > 0) {
                const relPayload = activeGlobalSkillIds.map(skillId => ({
                    setting_id: id,
                    skill_id: skillId,
                    is_active: true
                }));
                const { error: insRelErr } = await supabase.from('rel_setting_skills').insert(relPayload);
                if (insRelErr) throw new Error("Insert Selection: " + insRelErr.message);
            }

            // C. Specializations
            const { error: delSpecsErr } = await supabase.from('libraries_specializations').delete().eq('setting_id', id);
            if (delSpecsErr) throw new Error("Delete Specs: " + delSpecsErr.message);

            if (rules.libraries.specializations.length > 0) {
                const specsPayload = rules.libraries.specializations.map(s => ({
                    setting_id: id,
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    skill_ids: s.skillIds,
                    default_min_level: s.defaultMinLevel
                }));
                const { error: insSpecsErr } = await supabase.from('libraries_specializations').insert(specsPayload);
                if (insSpecsErr) throw new Error("Insert Specs: " + insSpecsErr.message);
            }

            // D. Backgrounds (Unified Save)
            const localBgsToSave = rules.libraries.backgrounds.filter(b => !b.isGlobal);
            const activeGlobalBgIds = rules.libraries.backgrounds
                .filter(b => b.isGlobal && b.isActive !== false)
                .map(b => b.id);

            const { error: delBgErr } = await supabase.from('libraries_backgrounds').delete().eq('setting_id', id);
            if (delBgErr) throw new Error("Delete Local Bgs: " + delBgErr.message);

            if (localBgsToSave.length > 0) {
                const bgPayload = localBgsToSave.map(b => ({
                    setting_id: id,
                    id: b.id,
                    name: b.name,
                    description: b.description,
                    is_variable: b.isVariable
                }));
                await supabase.from('libraries_backgrounds').insert(bgPayload);
            }

            const { error: delRelBgErr } = await supabase.from('rel_setting_backgrounds').delete().eq('setting_id', id);
            if (delRelBgErr) throw new Error("Delete Selection Bgs: " + delRelBgErr.message);

            if (activeGlobalBgIds.length > 0) {
                const relPayload = activeGlobalBgIds.map(bid => ({
                    setting_id: id,
                    background_id: bid,
                    is_active: true
                }));
                await supabase.from('rel_setting_backgrounds').insert(relPayload);
            }

            // E. Counters (Unified Save)
            const localCountersToSave = rules.libraries.counters.filter(c => !c.isGlobal);
            const activeGlobalCounterIds = rules.libraries.counters
                .filter(c => c.isGlobal && c.isActive !== false)
                .map(c => c.id);

            const { error: delCtrErr } = await supabase.from('libraries_counters').delete().eq('setting_id', id);
            if (delCtrErr) throw new Error("Delete Local Counters: " + delCtrErr.message);

            if (localCountersToSave.length > 0) {
                const ctrPayload = localCountersToSave.map(c => ({
                    setting_id: id,
                    id: c.id,
                    name: c.name,
                    max_value: c.maxValue,
                    default_value: c.defaultValue,
                    xp_cost: c.xpCost
                }));
                await supabase.from('libraries_counters').insert(ctrPayload);
            }

            const { error: delRelCtrErr } = await supabase.from('rel_setting_counters').delete().eq('setting_id', id);
            if (delRelCtrErr) throw new Error("Delete Selection Counters: " + delRelCtrErr.message);

            if (activeGlobalCounterIds.length > 0) {
                const relPayload = activeGlobalCounterIds.map(cid => ({
                    setting_id: id,
                    counter_id: cid,
                    is_active: true
                }));
                await supabase.from('rel_setting_counters').insert(relPayload);
            }
        } catch (libError) {
            console.error("Error saving libraries:", libError);
            return { success: false, message: `Erreur Bibliothèques: ${(libError as Error).message}` };
        }

        return { success: true };
    },

    /**
     * Delete a setting and all its related data
     */
    async deleteSetting(id: string): Promise<boolean> {
        // Delete libraries first (manual cascade just in case DB cascade isn't set)
        await supabase.from('libraries_traits').delete().eq('setting_id', id);
        await supabase.from('libraries_skills').delete().eq('setting_id', id);
        await supabase.from('libraries_specializations').delete().eq('setting_id', id);
        await supabase.from('libraries_backgrounds').delete().eq('setting_id', id);
        await supabase.from('libraries_counters').delete().eq('setting_id', id);

        // Delete the setting itself
        const { error } = await supabase.from('game_settings').delete().eq('id', id);

        if (error) {
            console.error('Error deleting setting:', error);
            return false;
        }
        return true;
    },

    /**
     * Toggle public/private visibility
     */
    async togglePublic(id: string, isPublic: boolean): Promise<boolean> {
        const { error } = await supabase
            .from('game_settings')
            .update({ is_public: isPublic })
            .eq('id', id);

        if (error) {
            console.error('Error toggling visibility:', error);
            return false;
        }
        return true;
    },

    async checkSchema(id: string): Promise<void> {
        console.log("--- DEBUG SCHEMA ---");

        // Check Skills Table
        const { data: skills, error: skillsError } = await supabase
            .from('libraries_skills')
            .select('*')
            .eq('setting_id', id)
            .limit(1);

        if (skillsError) console.error("Skills Schema Error:", skillsError);
        else console.log("Skills Sample:", skills?.[0] ? Object.keys(skills[0]) : "Empty Table");

        // Check Traits Table
        const { data: traits, error: traitsError } = await supabase
            .from('libraries_traits')
            .select('*')
            .eq('setting_id', id)
            .limit(1);

        if (traitsError) console.error("Traits Schema Error:", traitsError);
        else console.log("Traits Sample:", traits?.[0] ? Object.keys(traits[0]) : "Empty Table");
    }
}
