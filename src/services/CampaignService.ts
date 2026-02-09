import { supabase } from './supabase';
import { DatabaseService } from './DatabaseService';
import { GameSetting, RulesData, GameSettingSummary } from '../types/rules';
export type { GameSetting, RulesData, GameSettingSummary };
import { LibraryService } from './LibraryService';
import { ErrorService } from './ErrorService';
import { migrateRulesToV2 } from '../utils/migrations';
import { RulesDataSchema } from '../utils/validation/rulesSchema';

// Interface de la base de données (table game_settings)
interface DBGameSetting {
    id: string;
    name: string;
    version: string;
    last_updated: string;
    configurations: any; // JSONB
    definitions: any; // JSONB
    is_public: boolean;
}

export const CampaignService = {

    /**
     * List all available settings (campagnes)
     */
    async listSettings(): Promise<GameSettingSummary[] | null> {
        return await DatabaseService.fetchAll<GameSettingSummary>('game_settings', {
            select: 'id, name, version, last_updated, is_public',
            order: { column: 'last_updated', ascending: false }
        }, 'CampaignService.listSettings');
    },

    /**
     * Duplicate an existing setting
     */
    async duplicateSetting(id: string, newName: string): Promise<string | null> {
        const originalSetting = await CampaignService.loadSetting(id);

        if (!originalSetting) {
            ErrorService.handleError(new Error(`Setting with ID ${id} not found for duplication.`), {
                context: 'CampaignService.duplicateSetting',
                userMessage: "La campagne originale n'a pas été trouvée."
            });
            return null;
        }

        // Prepare rules for the new setting
        const newRules: Partial<RulesData> = {
            version: originalSetting.version,
            configurations: originalSetting.configurations,
            definitions: originalSetting.definitions,
            libraries: originalSetting.libraries,
            // Do not copy settingId, settingName, lastUpdated, is_public as they are specific to the original
        };

        // Create the new setting
        const newSettingId = await CampaignService.createSetting(newName, newRules);

        if (!newSettingId) {
            ErrorService.handleError(new Error(`Failed to create new setting for duplication of ${id}.`), {
                context: 'CampaignService.duplicateSetting',
                userMessage: "Échec de la création de la nouvelle campagne."
            });
            return null;
        }

        return newSettingId;
    },

    /**
     * Create a new empty setting
     */
    async createSetting(name: string, initialRules: Partial<RulesData>): Promise<string | null> {
        // Prepare JSONBs
        const configurations = initialRules.configurations || {};
        const definitions = initialRules.definitions || {};

        const inserted = await DatabaseService.insert<{ id: string }>('game_settings', {
            name,
            version: initialRules.version || '1.0.0',
            configurations,
            definitions,
            is_public: false
        }, 'CampaignService.createSetting');

        if (!inserted) return null;

        const result = Array.isArray(inserted) ? inserted[0] : inserted;
        const settingId = result.id;

        // Persist Libraries if present
        if (initialRules.libraries) {
            await LibraryService.persistInitialLibraries(settingId, initialRules);
        }

        return settingId;
    },

    /**
     * Load a full setting by ID
     */
    async loadSetting(id: string): Promise<RulesData | null> {
        if (!id || id === 'orphan') {
            return null;
        }

        try {
            // 1. Fetch Main Config
            const settingData = await DatabaseService.fetchOne<DBGameSetting>('game_settings', id, 'CampaignService.loadSetting');

            if (!settingData) {
                return null;
            }

            // 2. Load Libraries
            const libraries = await LibraryService.loadLibraries(id);

            const rulesRaw: any = migrateRulesToV2({
                version: settingData.version,
                lastUpdated: new Date(settingData.last_updated).getTime(),
                configurations: settingData.configurations,
                definitions: settingData.definitions,
                theme: settingData.configurations?.theme || { creationColor: "#000", xpColor: "#000" },
                libraries: libraries
            });

            // Validate with Zod
            const validationResult = RulesDataSchema.safeParse(rulesRaw);

            if (!validationResult.success) {
                console.warn("[CampaignService] Validation Details:", JSON.stringify(validationResult.error.flatten(), null, 2));
                ErrorService.handleError(new Error("Données de campagne non conformes"), {
                    context: 'CampaignService.loadSetting',
                    userMessage: "Certaines données de la campagne ne respectent pas le schéma attendu (voir console)."
                });
            }

            const rules = rulesRaw as RulesData;

            // Inject setting metadata
            rules.settingId = id;
            rules.settingName = settingData.name;
            rules.source = 'database';

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
            const bgCatDef = rules.definitions.skillCategories?.find((c: any) => c.behavior === 'Arrière-plan');
            const bgCat = bgCatDef?.id || 'Col_Comp_8';

            if (!rules.definitions.skills[bgCat]) rules.definitions.skills[bgCat] = [];
            libraries.backgrounds.forEach(b => {
                if (b.isActive !== false && !rules.definitions.skills[bgCat].includes(b.name)) {
                    rules.definitions.skills[bgCat].push(b.name);
                }
            });

            // Counters
            const counterCatDef = rules.definitions.skillCategories?.find((c: any) => c.behavior === 'Compteur');
            const counterCat = counterCatDef?.id || 'Col_Comp_9';
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
                    // Determine stable key: ID preferred for global, slug for local
                    const key = libCounter.id || libCounter.name
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '');

                    // Always synchronize definition with library data to prevent stale values (from legacy JSON)
                    rules.definitions.counters[key] = {
                        id: libCounter.id,
                        name: libCounter.name,
                        description: libCounter.description || rules.definitions.counters[key]?.description || '',
                        max: libCounter.maxValue ?? rules.definitions.counters[key]?.max ?? 10,
                        value: libCounter.defaultValue ?? rules.definitions.counters[key]?.value,
                        defaultValue: libCounter.defaultValue ?? rules.definitions.counters[key]?.defaultValue,
                        xpCost: libCounter.xpCost ?? rules.definitions.counters[key]?.xpCost ?? 0
                    };
                });
            }

            return rules;
        } catch (e) {
            ErrorService.handleError(e, { context: 'CampaignService.loadSetting', userMessage: "Erreur critique lors du chargement de la campagne." });
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

        const success = await DatabaseService.update('game_settings', id, rootUpdate, 'CampaignService.saveSetting');

        if (!success) {
            return { success: false, message: "Erreur MAJ Root" };
        }

        // 2. Synchronize Libraries
        try {
            await LibraryService.syncLibraries(id, rules);
        } catch (libError) {
            ErrorService.handleError(libError, { context: 'CampaignService.saveSetting', userMessage: "Erreur sauvegarde bibliothèques." });
            return { success: false, message: `Erreur Bibliothèques: ${(libError as Error).message}` };
        }

        return { success: true };
    },

    /**
     * Delete a setting and all its related data
     */
    async deleteSetting(id: string): Promise<boolean> {
        // Delete libraries first (manual cascade just in case DB cascade isn't set)
        await Promise.all([
            DatabaseService.deleteBy('libraries_traits', 'setting_id', id, 'CampaignService.deleteSetting.traits'),
            DatabaseService.deleteBy('libraries_skills', 'setting_id', id, 'CampaignService.deleteSetting.skills'),
            DatabaseService.deleteBy('libraries_specializations', 'setting_id', id, 'CampaignService.deleteSetting.specs'),
            DatabaseService.deleteBy('libraries_backgrounds', 'setting_id', id, 'CampaignService.deleteSetting.bgs'),
            DatabaseService.deleteBy('libraries_counters', 'setting_id', id, 'CampaignService.deleteSetting.counters')
        ]);

        // Delete the setting itself
        return await DatabaseService.delete('game_settings', id, 'CampaignService.deleteSetting');
    },

    /**
     * Toggle public/private visibility
     */
    async togglePublic(id: string, isPublic: boolean): Promise<boolean> {
        return await DatabaseService.update('game_settings', id, { is_public: isPublic }, 'CampaignService.togglePublic');
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
