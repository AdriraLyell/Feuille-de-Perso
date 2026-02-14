import { supabase } from './supabase';
import { DatabaseService } from './DatabaseService';
import { GameSetting, RulesData, GameSettingSummary } from '../types/rules';
export type { GameSetting, RulesData, GameSettingSummary };
import { LibraryService } from './LibraryService';
import { logger } from '../utils/logger';
import { ErrorService } from './ErrorService';
import { migrateRulesToV2 } from '../utils/migrations';
import { RulesDataSchema } from '../utils/validation/rulesSchema';
import { TABLE_GAME_SETTINGS, TABLE_LIBRARIES_TRAITS, TABLE_LIBRARIES_SKILLS, TABLE_LIBRARIES_SPECIALIZATIONS, TABLE_LIBRARIES_BACKGROUNDS, TABLE_LIBRARIES_COUNTERS } from '../constants/db';
import { SKILL_COLUMNS } from '../constants/app';

// Interface de la base de données (table game_settings)
interface DBGameSetting {
    id: string;
    name: string;
    version: string;
    last_updated: string;
    configurations: RulesData['configurations']; // JSONB
    definitions: RulesData['definitions']; // JSONB
    is_public: boolean;
    is_archived: boolean;
    description: string | null;
    welcome_message: string | null;
    show_metadata_to_players: boolean;
}

export const CampaignService = {

    /**
     * List all available settings (campagnes)
     */
    async listSettings(): Promise<GameSettingSummary[] | null> {
        return await DatabaseService.fetchAll<GameSettingSummary>(TABLE_GAME_SETTINGS, {
            select: 'id, name, version, last_updated, is_public, is_archived',
            order: { column: 'last_updated', ascending: false }
        }, 'CampaignService.listSettings');
    },

    /**
     * List public settings available for players
     */
    async listPublicSettings(): Promise<GameSettingSummary[]> {
        return await DatabaseService.fetchAll<GameSettingSummary>(
            TABLE_GAME_SETTINGS,
            {
                select: 'id, name, version, last_updated, is_public',
                eq: { is_public: true },
                order: { column: 'last_updated', ascending: false }
            },
            'CampaignService.listPublicSettings'
        ) || [];
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

        const inserted = await DatabaseService.insert<{ id: string }>(TABLE_GAME_SETTINGS, {
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
            const settingData = await DatabaseService.fetchOne<DBGameSetting>(TABLE_GAME_SETTINGS, id, 'CampaignService.loadSetting');

            if (!settingData) {
                return null;
            }

            // 2. Load Libraries
            const libraries = await LibraryService.loadLibraries(id);

            const rulesRaw = migrateRulesToV2({
                version: settingData.version,
                lastUpdated: new Date(settingData.last_updated).getTime(),
                configurations: settingData.configurations,
                definitions: settingData.definitions,
                theme: (settingData.configurations as Record<string, unknown>)?.theme as { creationColor: string; xpColor: string } || { creationColor: "#000", xpColor: "#000" },
                libraries: libraries
            });

            // Validate with Zod
            const validationResult = RulesDataSchema.safeParse(rulesRaw);

            if (!validationResult.success) {
                logger.warn("[CampaignService] Validation Details:", JSON.stringify(validationResult.error.flatten(), null, 2));
                ErrorService.handleError(new Error("Données de campagne non conformes"), {
                    context: 'CampaignService.loadSetting',
                    userMessage: "Certaines données de la campagne ne respectent pas le schéma attendu (voir console)."
                });
                return null; // Don't proceed with invalid data
            }

            const rules = validationResult.data as RulesData;

            // Inject setting metadata
            rules.settingId = id;
            rules.settingName = settingData.name;
            rules.description = settingData.description || undefined;
            rules.welcomeMessage = settingData.welcome_message || undefined;
            rules.showMetadataToPlayers = settingData.show_metadata_to_players;
            rules.isArchived = settingData.is_archived;
            rules.source = 'database';

            // 3. REBUILD definitions.skills layout from libraries if needed
            // Only rebuild if the current layout is empty or significantly different
            const currentLayoutKeys = Object.keys(rules.definitions.skills || {});
            const hasExistingLayout = currentLayoutKeys.length > 0 && currentLayoutKeys.some(k => rules.definitions.skills?.[k] && (rules.definitions.skills[k] as string[]).length > 0);

            if (!hasExistingLayout && libraries.skills.length > 0) {
                logger.log("[CampaignService] Rebuilding skill layout from library (empty layout detected)");
                if (!rules.definitions.skills) rules.definitions.skills = {};

                libraries.skills.forEach(s => {
                    if (s.isActive !== false) {
                        const cat = s.defaultCategory || SKILL_COLUMNS.COL_2;
                        if (!rules.definitions.skills[cat]) rules.definitions.skills[cat] = [];
                        if (!rules.definitions.skills[cat].includes(s.name)) {
                            rules.definitions.skills[cat].push(s.name);
                        }
                    }
                });
            }

            // Ensure categories from libraries exist in skillCategories if migrateRules didn't find them
            // Backgrounds
            const bgCatDef = rules.definitions.skillCategories?.find((c) => c.behavior === 'Arrière-plan');
            const bgCat = bgCatDef?.id || SKILL_COLUMNS.COL_8;

            if (!rules.definitions.skills[bgCat]) rules.definitions.skills[bgCat] = [];
            libraries.backgrounds.forEach(b => {
                if (b.isActive !== false && !rules.definitions.skills[bgCat].includes(b.name)) {
                    rules.definitions.skills[bgCat].push(b.name);
                }
            });

            // Counters
            const counterCatDef = rules.definitions.skillCategories?.find((c) => c.behavior === 'Compteur');
            const counterCat = counterCatDef?.id || SKILL_COLUMNS.COL_9;
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
        const rootUpdate: Partial<DBGameSetting> = {
            version: rules.version,
            last_updated: new Date().toISOString(),
            configurations: rules.configurations,
            definitions: rules.definitions,
            description: rules.description || null,
            welcome_message: rules.welcomeMessage || null,
            show_metadata_to_players: !!rules.showMetadataToPlayers,
            is_archived: !!rules.isArchived
        };
        if (name) rootUpdate.name = name;

        const success = await DatabaseService.update(TABLE_GAME_SETTINGS, id, rootUpdate, 'CampaignService.saveSetting');

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
        const results = await Promise.allSettled([
            DatabaseService.deleteBy(TABLE_LIBRARIES_TRAITS, 'setting_id', id, 'CampaignService.deleteSetting.traits'),
            DatabaseService.deleteBy(TABLE_LIBRARIES_SKILLS, 'setting_id', id, 'CampaignService.deleteSetting.skills'),
            DatabaseService.deleteBy(TABLE_LIBRARIES_SPECIALIZATIONS, 'setting_id', id, 'CampaignService.deleteSetting.specs'),
            DatabaseService.deleteBy(TABLE_LIBRARIES_BACKGROUNDS, 'setting_id', id, 'CampaignService.deleteSetting.bgs'),
            DatabaseService.deleteBy(TABLE_LIBRARIES_COUNTERS, 'setting_id', id, 'CampaignService.deleteSetting.counters')
        ]);

        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            ErrorService.handleError(new Error(`${failures.length} suppressions de bibliothèques échouées`), {
                context: 'CampaignService.deleteSetting'
            });
            return false;
        }

        // Delete the setting itself
        return await DatabaseService.delete('game_settings', id, 'CampaignService.deleteSetting');
    },

    /**
     * Toggle public/private visibility
     */
    async togglePublic(id: string, isPublic: boolean): Promise<boolean> {
        return await DatabaseService.update(TABLE_GAME_SETTINGS, id, { is_public: isPublic }, 'CampaignService.togglePublic');
    },

    /**
     * Set archived status
     */
    async setArchived(id: string, isArchived: boolean): Promise<boolean> {
        return await DatabaseService.update(TABLE_GAME_SETTINGS, id, { is_archived: isArchived }, 'CampaignService.setArchived');
    },

    /**
     * Manual schema check for a setting
     */
    async checkSchema(id: string): Promise<boolean> {
        try {
            const rules = await CampaignService.loadSetting(id);
            if (!rules) return false;
            // loadSetting already performs Zod validation
            return true;
        } catch (e) {
            return false;
        }
    }

}
