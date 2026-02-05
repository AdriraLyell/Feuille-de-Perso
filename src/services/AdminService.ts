
import { supabase } from './supabase';
import { GameSetting, RulesData, GameSettingSummary } from '../types/rules';
export type { GameSetting, RulesData, GameSettingSummary };
import { INITIAL_DATA } from '../data/initialState';
import { LibraryService } from './LibraryService';


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

        const rules: RulesData = {
            version: settingData.version,
            lastUpdated: new Date(settingData.last_updated).getTime(),
            // @ts-ignore
            configurations: settingData.configurations,
            // @ts-ignore
            definitions: settingData.definitions,
            // @ts-ignore
            theme: settingData.configurations.theme || { creationColor: "#000", xpColor: "#000" },
            libraries: libraries
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
