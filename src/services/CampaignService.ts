import { DatabaseService } from './DatabaseService';
import { supabase } from './supabase';
import { GameSetting, RulesData, GameSettingSummary, processRulesDataForBonusMJ } from '../types/rules';

export type { GameSetting, RulesData, GameSettingSummary };
import { LibraryService } from './LibraryService';
import { logger } from '../utils/logger';
import { ErrorService } from './ErrorService';
import { migrateRulesToV2 } from '../utils/migrations';
import { RulesDataSchema } from '../utils/validation/rulesSchema';
import { TABLE_GAME_SETTINGS, TABLE_LIBRARIES_TRAITS, TABLE_LIBRARIES_SKILLS, TABLE_LIBRARIES_SPECIALIZATIONS, TABLE_LIBRARIES_BACKGROUNDS, TABLE_LIBRARIES_COUNTERS } from '../constants/db';
import { reconcileRulesWithLibraries } from '../utils/reconcilers/campaignReconciler';

// Interface de la base de données (table game_settings)
interface DBGameSetting {
    id: string;
    name: string;
    version: string;
    updated_at: string;
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
            select: 'id, name, version, updated_at, is_public, is_archived',
            order: { column: 'updated_at', ascending: false }
        }, 'CampaignService.listSettings');
    },

    /**
     * List public settings available for players
     */
    async listPublicSettings(): Promise<GameSettingSummary[]> {
        return await DatabaseService.fetchAll<GameSettingSummary>(
            TABLE_GAME_SETTINGS,
            {
                select: 'id, name, version, updated_at, is_public',
                eq: { is_public: true },
                order: { column: 'updated_at', ascending: false }
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
                lastUpdated: new Date(settingData.updated_at).getTime(),
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

            const rules = processRulesDataForBonusMJ(validationResult.data as RulesData);

            // Inject setting metadata
            rules.settingId = id;
            rules.settingName = settingData.name;
            rules.description = settingData.description || undefined;
            rules.welcomeMessage = settingData.welcome_message || undefined;
            rules.showMetadataToPlayers = settingData.show_metadata_to_players;
            rules.isArchived = settingData.is_archived;
            rules.source = 'database';

            // 3. Reconcile with libraries
            return reconcileRulesWithLibraries(rules, libraries);
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

        // 1. Synchronize Libraries FIRST
        // Les bibliothèques doivent être commitées AVANT l'update de game_settings,
        // car cet update déclenche un événement Supabase Realtime vers les fiches joueurs.
        // Si on inversait l'ordre, les joueurs recevraient le ping avant que les traits
        // soient disponibles (race condition).
        try {
            await LibraryService.syncLibraries(id, rules);
        } catch (libError) {
            ErrorService.handleError(libError, { context: 'CampaignService.saveSetting', userMessage: "Erreur sauvegarde bibliothèques." });
            return { success: false, message: `Erreur Bibliothèques: ${(libError as Error).message}` };
        }

        // 2. Update Root LAST (triggers Supabase Realtime → player sheets reload rules)
        const rootUpdate: Partial<DBGameSetting> = {
            version: rules.version,
            updated_at: new Date().toISOString(),
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

        return { success: true };
    },

    /**
     * Surgical Update: Only update the calendar configuration.
     * This is much lighter than saveSetting because it skips library synchronization.
     * Triggers Supabase Realtime for the campaign.
     */
    async patchCalendar(id: string, calendar: RulesData['configurations']['calendar']): Promise<{ success: boolean; message?: string }> {
        if (!id || !calendar) return { success: false, message: "Données manquantes" };

        try {
            // 1. Vérifier l'auth (Log only for debug)
            const { data: { session } } = await supabase.auth.getSession();
            logger.info("[CampaignService] Session status:", session ? "Authenticated" : "Anonymous");

            // 2. Charger les configurations actuelles
            const current = await CampaignService.loadSetting(id);
            if (!current) {
                logger.error("[CampaignService] Impossible de charger les règles pour id:", id);
                return { success: false, message: "Campagne introuvable." };
            }

            // 3. Fusionner les configurations
            const updatedConfigurations = {
                ...current.configurations,
                calendar
            };

            const dateToLog = calendar.type === 'real' ? calendar.currentDate : `An ${calendar.currentYear}`;
            logger.info("[CampaignService] Patching calendar for:", id, "New Date:", dateToLog);

            // 4. Update via DatabaseService
            const success = await DatabaseService.update(
                TABLE_GAME_SETTINGS,
                id,
                { 
                    configurations: updatedConfigurations,
                    updated_at: new Date().toISOString()
                },
                'CampaignService.patchCalendar'
            );

            if (!success) {
                logger.error("[CampaignService] Mise à jour en base échouée (possiblement RLS).");
                return { success: false, message: "Erreur persistante lors de la sauvegarde (Vérifiez vos droits MJ)." };
            }

            return { success: true };
        } catch (e) {
            logger.error("[CampaignService] Exception in patchCalendar:", e);
            return { success: false, message: "Exception lors du patch calendrier." };
        }
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
        } catch {
            return false;
        }
    }

}
