/**
 * CharacterSyncService
 *
 * Handles synchronization of player character sheets to Supabase.
 * Players can sync their sheets manually; Admin can read them.
 *
 * NOTE: bookDocument is intentionally excluded from the main sync payload.
 * It is stored separately in the `character_books` table via BookSyncService.
 */

import { DatabaseService } from './DatabaseService';
import { CharacterSheetData } from '../types/character';

import { ImageSyncResolver } from './ImageSyncResolver';
import { ErrorService } from './ErrorService';
import { BookSyncService } from './BookSyncService';

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

export interface CharacterHistoryEntry {
    id: string;
    character_id: string;
    data: CharacterSheetData;
    metadata: {
        player_name: string;
        character_name: string;
        last_synced: string;
    };
    archived_at: string;
    version_reason: 'manual' | 'auto_1h';
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
     * bookDocument is excluded: it lives in character_books, not in the main data.
     */
    generateDataHash(data: CharacterSheetData): string {
        try {
            // Exclude volatile and externalized fields from the hash
            const { syncInfo: _, appLogs: __, xpLogs: ___, _rulesVersion: ____, bookDocument: _____, ...stableData } = data;

            // Fast hashing via string manipulation
            const str = JSON.stringify(stableData);
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(36);
        } catch {
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
        data: CharacterSheetData,
        mode: 'manual' | 'auto' = 'manual'
    ): Promise<SyncResult> {
        try {
            // Step 0: Inject sync mode and strip redundant SQL fields from JSONB
            const cleanSyncInfo = { ...data.syncInfo, syncMode: mode };
            delete cleanSyncInfo.settingId;
            delete cleanSyncInfo.lastSynced;

            data.syncInfo = cleanSyncInfo;

            // Step 1: Exclude bookDocument from the main payload — stored in character_books
            const { bookDocument, ...dataWithoutBook } = data;

            // Step 2: Resolve and compress images for portable sync
            const dataToStore = await ImageSyncResolver.resolveImagesForSync(dataWithoutBook as CharacterSheetData);

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

            // Step 3: Sync bookDocument separately if present
            if (bookDocument?.content) {
                await BookSyncService.saveBook(
                    result.id,
                    bookDocument.content,
                    bookDocument.formatVersion ?? 2
                );
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
     * Get all FULL characters synced to a specific campaign (for Roster view).
     */
    async getFullCharactersBySettingId(settingId: string): Promise<SyncedCharacter[]> {
        const characters = await DatabaseService.fetchAll<SyncedCharacter>(
            'characters',
            {
                select: '*',
                eq: { setting_id: settingId },
                order: { column: 'last_synced', ascending: false }
            },
            'CharacterSyncService.getFullCharactersBySettingId'
        );

        return characters.map(c => this._enrichCharacterData(c));
    },

    /**
     * Get a single character by ID (for Admin or Player detail view).
     */
    async getCharacterById(id: string): Promise<SyncedCharacter | null> {
        const character = await DatabaseService.fetchOne<SyncedCharacter>(
            'characters',
            id,
            'CharacterSyncService.getCharacterById'
        );

        return character ? this._enrichCharacterData(character) : null;
    },

    /**
     * Internal helper to merge SQL columns into the JSONB syncInfo for app compatibility.
     */
    _enrichCharacterData(character: SyncedCharacter): SyncedCharacter {
        if (!character.data) return character;

        return {
            ...character,
            data: {
                ...character.data,
                syncInfo: {
                    ...(character.data.syncInfo || {}),
                    syncId: character.id,
                    settingId: character.setting_id || 'orphan',
                    lastSynced: new Date(character.last_synced).getTime()
                }
            }
        };
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
                    mjMessage: message
                    // lastSynced is handled by the SQL column in updateCharacterData
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
    },

    /**
     * Get historical versions for a character.
     */
    async getCharacterHistory(characterId: string): Promise<CharacterHistoryEntry[]> {
        return await DatabaseService.fetchAll<CharacterHistoryEntry>(
            'characters_history',
            {
                select: '*',
                eq: { character_id: characterId },
                order: { column: 'archived_at', ascending: false }
            },
            'CharacterSyncService.getCharacterHistory'
        );
    }
};
