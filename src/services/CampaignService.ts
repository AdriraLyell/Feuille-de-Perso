
import { supabase } from './supabase';
import { GameSetting, RulesData, GameSettingSummary } from '../types/rules';
export type { GameSetting, RulesData, GameSettingSummary };
import { INITIAL_DATA } from '../data/initialState';
import { LibraryService } from './LibraryService';
import { migrateRulesToV2 } from '../utils/migrations';


export const CampaignService = {

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
            await LibraryService.persistInitialLibraries(settingId, initialRules);
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
        try {
            // 1. Fetch Main Config
            const { data: settingData, error: settingError } = await supabase
                .from('game_settings')
                .select('*')
                .eq('id', id)
                .single();

            if (settingError || !settingData) {
                console.error('Error loading setting:', settingError);
                return null;
            }

            // 2. Load Libraries
            const libraries = await LibraryService.loadLibraries(id);

            const rules: RulesData = migrateRulesToV2({
                version: settingData.version,
                lastUpdated: new Date(settingData.last_updated).getTime(),
                // @ts-ignore
                configurations: settingData.configurations,
                // @ts-ignore
                definitions: settingData.definitions,
                // @ts-ignore
                theme: settingData.configurations?.theme || { creationColor: "#000", xpColor: "#000" },
                libraries: libraries
            });

            // Inject setting metadata
            (rules as any).settingId = id;
            (rules as any).settingName = settingData.name;

            // 3. REBUILD definitions.skills layout from libraries if needed
            // Only rebuild if the current layout is empty or significantly different
            const currentLayoutKeys = Object.keys(rules.definitions.skills || {});
            const hasExistingLayout = currentLayoutKeys.length > 0 && currentLayoutKeys.some(k => (rules.definitions.skills as any)[k]?.length > 0);

            if (!hasExistingLayout && libraries.skills.length > 0) {
                console.log("[CampaignService] Rebuilding skill layout from library (empty layout detected)");
                if (!rules.definitions.skills) rules.definitions.skills = {};

                libraries.skills.forEach(s => {
                    if (s.isActive !== false) {
                        const cat = s.defaultCategory || 'Col_Comp_2';
                        if (!rules.definitions.skills[cat]) rules.definitions.skills[cat] = [];
                        if (!rules.definitions.skills[cat].includes(s.name)) {
                            rules.definitions.skills[cat].push(s.name);
                        }
                    }
                });
            }

            // Ensure categories from libraries exist in skillCategories if migrateRules didn't find them
            // Backgrounds
            const bgCat = 'Col_Comp_8';
            if (!rules.definitions.skills[bgCat]) rules.definitions.skills[bgCat] = [];
            libraries.backgrounds.forEach(b => {
                if (b.isActive !== false && !rules.definitions.skills[bgCat].includes(b.name)) {
                    rules.definitions.skills[bgCat].push(b.name);
                }
            });

            // Counters
            const counterCat = 'Col_Comp_9';
            if (!rules.definitions.skills[counterCat]) rules.definitions.skills[counterCat] = [];
            libraries.counters.forEach(c => {
                if (c.isActive !== false && !rules.definitions.skills[counterCat].includes(c.name)) {
                    rules.definitions.skills[counterCat].push(c.name);
                }
            });

            // Sync definitions.counters map (for specific counter definitions like max/xpCost)
            if (libraries.counters && libraries.counters.length > 0) {
                const activeCounters = libraries.counters.filter(c => c.isActive !== false);

                if (!rules.definitions.counters) {
                    rules.definitions.counters = {};
                }

                activeCounters.forEach(libCounter => {
                    const key = libCounter.name
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '');

                    if (!rules.definitions.counters[key]) {
                        rules.definitions.counters[key] = {
                            id: libCounter.id,
                            name: libCounter.name,
                            description: libCounter.description || '',
                            max: (libCounter as any).maxValue || 10,
                            value: (libCounter as any).defaultValue || 0,
                            defaultValue: (libCounter as any).defaultValue || 0,
                            xpCost: (libCounter as any).xpCost || 0
                        };
                    } else {
                        rules.definitions.counters[key].description = libCounter.description || rules.definitions.counters[key].description;
                    }
                });
            }

            return rules;
        } catch (e) {
            console.error("[CampaignService] Critical error loading setting:", e);
            return null;
        }
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

        // 2. Synchronize Libraries
        try {
            await LibraryService.syncLibraries(id, rules);
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

    /**
     * Duplicate a setting (copy rules and libraries, but no characters)
     */
    async duplicateSetting(sourceId: string, newName: string): Promise<string | null> {
        try {
            // 1. Load source setting
            const sourceRules = await this.loadSetting(sourceId);
            if (!sourceRules) throw new Error("Source setting not found");

            // 2. Clone rules object (Deep Copy)
            const clonedRules: RulesData = JSON.parse(JSON.stringify(sourceRules));

            // Generate mapping for local IDs to new local IDs
            // (Globals remain shared)
            const idMap = new Map<string, string>();
            const generateNewId = () => Math.random().toString(36).substring(2, 11);

            // 3. Process Libraries - Generate new IDs for local items
            // Traits
            clonedRules.libraries.traits = clonedRules.libraries.traits.map(t => {
                const newId = generateNewId();
                idMap.set(t.id, newId);
                return { ...t, id: newId };
            });

            // Skills
            clonedRules.libraries.skills = clonedRules.libraries.skills.map(s => {
                if (s.isGlobal) return s;
                const newId = generateNewId();
                idMap.set(s.id, newId);
                return { ...s, id: newId };
            });

            // Specializations
            clonedRules.libraries.specializations = clonedRules.libraries.specializations.map(s => {
                const newId = generateNewId();
                idMap.set(s.id, newId);
                // Update internal skill links
                const newSkillIds = (s.skillIds || []).map(sid => idMap.get(sid) || sid);
                return { ...s, id: newId, skillIds: newSkillIds };
            });

            // Backgrounds
            clonedRules.libraries.backgrounds = clonedRules.libraries.backgrounds.map(b => {
                if (b.isGlobal) return b;
                const newId = generateNewId();
                idMap.set(b.id, newId);
                return { ...b, id: newId };
            });

            // Counters
            clonedRules.libraries.counters = clonedRules.libraries.counters.map(c => {
                if (c.isGlobal) return c;
                const newId = generateNewId();
                idMap.set(c.id, newId);
                return { ...c, id: newId };
            });

            // 4. Update definitions.counters (if they reference library IDs)
            if (clonedRules.definitions.counters) {
                Object.keys(clonedRules.definitions.counters).forEach(key => {
                    const def = clonedRules.definitions.counters[key];
                    if (def.id && idMap.has(def.id)) {
                        def.id = idMap.get(def.id)!;
                    }
                });
            }

            // 5. Create new setting
            return await this.createSetting(newName, clonedRules);

        } catch (e) {
            console.error("[CampaignService] Duplication failed:", e);
            return null;
        }
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
    },

}
