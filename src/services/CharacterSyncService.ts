/**
 * CharacterSyncService
 * 
 * Handles synchronization of player character sheets to Supabase.
 * Players can sync their sheets manually; Admin can read them.
 */

import { DatabaseService } from './DatabaseService';
import { CharacterSheetData } from '../types/character';

import { ImageSyncResolver } from './ImageSyncResolver';
import { ErrorService } from './ErrorService';

// Types for sync operations
export interface SyncedCharacter {
    id: string;
    setting_id: string;
    character_name: string;
    player_name: string;
    data: CharacterSheetData;
    last_synced: string;
    created_at: string;
}

export interface SyncedCharacterSummary {
    id: string;
    setting_id: string;
    character_name: string;
    player_name: string;
    last_synced: string;
    data_size?: number; // Real size in bytes from view_characters_summary
}

export interface SyncResult {
    success: boolean;
    syncId?: string;
    hash?: string;
    error?: string;
}

// Assuming SyncInfo is part of CharacterSheetData, or a sub-interface.
// The instruction implies adding this field to the SyncInfo structure.
// For the purpose of this file, we'll assume CharacterSheetData's syncInfo property
// will now include mjMessage. The actual type definition for SyncInfo would be in '../types/character'.
// The provided snippet seems to be an attempt to show the *content* of the SyncInfo type.
// We will not add a new type definition here, but acknowledge the change in the external type.

export const CharacterSyncService = {

    /**
     * Generate a short digital signature of the character data.
     * Used for conflict detection and 'dirty' checking.
     */
    generateDataHash(data: CharacterSheetData): string {
        try {
            // We ignore volatile fields for the hash
            const { syncInfo, appLogs, xpLogs, _rulesVersion, ...stableData } = data;

            // Fast hashing via string manipulation
            const str = JSON.stringify(stableData);
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(36);
        } catch (e) {
            return "unknown";
        }
    },

    /**
     * Sync a character sheet to the database.

     * Uses upsert: creates if new, updates if exists (same setting/player/character combo).
     */
    async syncCharacter(
        settingId: string,
        playerName: string,
        characterName: string,
        data: CharacterSheetData
    ): Promise<SyncResult> {
        try {
            // Step 1: Resolve and compress images for portable sync
            const dataToStore = await ImageSyncResolver.resolveImagesForSync(data);

            const result = await DatabaseService.upsert<{ id: string }>(
                'characters',
                {
                    setting_id: (settingId === 'orphan' || !settingId) ? null : settingId,
                    player_name: playerName.trim(),
                    character_name: characterName.trim(),
                    data: dataToStore,
                    last_synced: new Date().toISOString()
                },
                {
                    onConflict: 'setting_id,character_name,player_name',
                    ignoreDuplicates: false
                },
                'CharacterSyncService.syncCharacter'
            );

            if (!result) {
                return { success: false, error: "Erreur de synchronisation (DatabaseService)." };
            }

            return {
                success: true,
                syncId: result.id,
                hash: this.generateDataHash(data)
            };
        } catch (e) {
            ErrorService.handleError(e, { context: 'CharacterSyncService.syncCharacter' });
            return { success: false, error: (e as Error).message };
        }
    },

    /**
     * Get all characters synced by a specific player (for cloud loading).
     */
    async getCharactersByPlayerName(playerName: string): Promise<SyncedCharacterSummary[]> {
        return await DatabaseService.fetchAll<SyncedCharacterSummary>(
            'view_characters_summary',
            {
                select: 'id, character_name, player_name, last_synced, setting_id, data_size',
                eq: { player_name: playerName.trim() },
                order: { column: 'last_synced', ascending: false }
            },
            'CharacterSyncService.getCharactersByPlayerName'
        );
    },

    /**
     * Get ALL characters across all campaigns (for Admin Master List).
     */
    async getAllCharacters(): Promise<SyncedCharacterSummary[]> {
        return await DatabaseService.fetchAll<SyncedCharacterSummary>(
            'view_characters_summary',
            {
                select: 'id, character_name, player_name, last_synced, setting_id, data_size',
                order: { column: 'last_synced', ascending: false }
            },
            'CharacterSyncService.getAllCharacters'
        );
    },

    /**
     * Get all characters synced to a specific campaign (for Admin view).
     */
    async getCharactersBySettingId(settingId: string): Promise<SyncedCharacterSummary[]> {
        return await DatabaseService.fetchAll<SyncedCharacterSummary>(
            'view_characters_summary',
            {
                select: 'id, setting_id, character_name, player_name, last_synced, data_size',
                eq: { setting_id: settingId },
                order: { column: 'last_synced', ascending: false }
            },
            'CharacterSyncService.getCharactersBySettingId'
        );
    },

    /**
     * Get a single character by ID (for Admin or Player detail view).
     */
    async getCharacterById(id: string): Promise<SyncedCharacter | null> {
        return await DatabaseService.fetchOne<SyncedCharacter>(
            'characters',
            id,
            'CharacterSyncService.getCharacterById'
        );
    },

    /**
     * Update character data directly (MJ/Admin).
     * Used when the MJ makes manual modifications and wants to push them.
     */
    async updateCharacterData(id: string, data: CharacterSheetData): Promise<boolean> {
        try {
            // Re-compress images for storage
            const dataToStore = await ImageSyncResolver.resolveImagesForSync(data);

            return await DatabaseService.update(
                'characters',
                id,
                {
                    data: dataToStore,
                    last_synced: new Date().toISOString()
                },
                'CharacterSyncService.updateCharacterData'
            );
        } catch (e) {
            ErrorService.handleError(e, { context: 'CharacterSyncService.updateCharacterData' });
            return false;
        }
    },

    /**
     * Signal to the player that a manual update has been made by the MJ.
     * This updates the timestamp AND can inject a specific message.
     */
    async requestForceUpdate(id: string, message?: string): Promise<boolean> {
        try {
            // We need to fetch the character first to avoid wiping data if we just update the timestamp
            const character = await this.getCharacterById(id);
            if (!character) return false;

            const updatedData: CharacterSheetData = {
                ...character.data,
                syncInfo: {
                    ...(character.data.syncInfo || {}),
                    mjMessage: message,
                    lastSynced: Date.now()
                }
            };

            return await this.updateCharacterData(id, updatedData);
        } catch (e) {
            ErrorService.handleError(e, { context: 'CharacterSyncService.requestForceUpdate' });
            return false;
        }
    },

    /**
     * Delete a synced character (Admin only, if needed later).
     */
    async deleteCharacter(id: string): Promise<boolean> {
        return await DatabaseService.delete(
            'characters',
            id,
            'CharacterSyncService.deleteCharacter'
        );
    },

    /**
     * Check if character sync table exists and is accessible.
     */
    async checkSyncAvailable(): Promise<boolean> {
        return await DatabaseService.checkAvailable('characters');
    },

    async processImages(obj: any, action: 'compress' | 'decompress'): Promise<any> {
        return action === 'compress'
            ? ImageSyncResolver.resolveImagesForSync(obj)
            : ImageSyncResolver.injectImagesAfterSync(obj);
    }
};
