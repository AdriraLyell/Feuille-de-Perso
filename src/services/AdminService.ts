
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

                // B. Skills
                if (initialRules.libraries.skills && initialRules.libraries.skills.length > 0) {
                    const skillsPayload = initialRules.libraries.skills.map(s => ({
                        setting_id: settingId,
                        ...s
                    }));
                    await supabase.from('libraries_skills').insert(skillsPayload);
                }

                // C. Specializations
                if (initialRules.libraries.specializations && initialRules.libraries.specializations.length > 0) {
                    const specsPayload = initialRules.libraries.specializations.map(s => ({
                        setting_id: settingId,
                        ...s
                    }));
                    await supabase.from('libraries_specializations').insert(specsPayload);
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
        const [traitsRes, skillsRes, specsRes] = await Promise.all([
            supabase.from('libraries_traits').select('*').eq('setting_id', id),
            supabase.from('libraries_skills').select('*').eq('setting_id', id),
            supabase.from('libraries_specializations').select('*').eq('setting_id', id)
        ]);

        // Construct the full object
        const rules: RulesData = {
            version: setting.version,
            lastUpdated: new Date(setting.last_updated).getTime(),
            // @ts-ignore - DB Types vs TS Types mapping
            configurations: setting.configurations,
            // @ts-ignore
            definitions: setting.definitions,
            // @ts-ignore
            theme: setting.configurations.theme || { creationColor: "#000", xpColor: "#000" }, // Fallback
            libraries: {
                traits: traitsRes.data || [],
                skills: skillsRes.data || [],
                specializations: specsRes.data || []
            }
        };

        return rules;
    },

    /**
     * Save/Update a setting
     * This is complex because we must save the root AND the libraries
     */
    async saveSetting(id: string, rules: RulesData, name?: string): Promise<boolean> {

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
            return false;
        }

        // 2. Update Libraries (Naive Strategy: Delete All & Re-Insert)
        // This is safe because 'setting_id' links them. 
        // Ideally we would do Diffing, but for a "Save" button, replacing is robust.

        // A. Traits
        await supabase.from('libraries_traits').delete().eq('setting_id', id);
        if (rules.libraries.traits.length > 0) {
            const traitsPayload = rules.libraries.traits.map(t => ({
                setting_id: id,
                ...t
            }));
            await supabase.from('libraries_traits').insert(traitsPayload);
        }

        // B. Skills
        await supabase.from('libraries_skills').delete().eq('setting_id', id);
        if (rules.libraries.skills.length > 0) {
            const skillsPayload = rules.libraries.skills.map(s => ({
                setting_id: id,
                ...s
            }));
            await supabase.from('libraries_skills').insert(skillsPayload);
        }

        // C. Specializations
        await supabase.from('libraries_specializations').delete().eq('setting_id', id);
        if (rules.libraries.specializations.length > 0) {
            const specsPayload = rules.libraries.specializations.map(s => ({
                setting_id: id,
                ...s
            }));
            await supabase.from('libraries_specializations').insert(specsPayload);
        }

        return true;
    },

    /**
     * Delete a setting and all its related data
     */
    async deleteSetting(id: string): Promise<boolean> {
        // Delete libraries first (manual cascade just in case DB cascade isn't set)
        await supabase.from('libraries_traits').delete().eq('setting_id', id);
        await supabase.from('libraries_skills').delete().eq('setting_id', id);
        await supabase.from('libraries_specializations').delete().eq('setting_id', id);

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
    }
}
