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
}

export interface SyncResult {
    success: boolean;
    syncId?: string;
    error?: string;
}

export const CharacterSyncService = {

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
            // Remove syncInfo from the data being stored to avoid circular reference
            const { syncInfo, ...cleanData } = data;

            // Step 1: Resolve and compress images for portable sync
            const dataToStore = await ImageSyncResolver.resolveImagesForSync(cleanData);

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

            return { success: true, syncId: result.id };
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
            'characters',
            {
                select: 'id, character_name, player_name, last_synced, setting_id',
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
            'characters',
            {
                select: 'id, character_name, player_name, last_synced, setting_id',
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
            'characters',
            {
                select: 'id, setting_id, character_name, player_name, last_synced',
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
