/**
 * CharacterSyncService
 * 
 * Handles synchronization of player character sheets to Supabase.
 * Players can sync their sheets manually; Admin can read them.
 */

import { supabase } from './supabase';
import { CharacterSheetData } from '../types/character';
import { ImageCompressionService } from './ImageCompressionService';

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

            // Step 1: Compress images in data
            const dataToStore = await this.processImages(cleanData, 'compress');

            const { data: result, error } = await supabase
                .from('characters')
                .upsert(
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
                    }
                )
                .select('id')
                .single();

            if (error) {
                console.error('[CharacterSyncService] Sync error:', error);
                return { success: false, error: error.message };
            }

            return { success: true, syncId: result.id };
        } catch (e) {
            console.error('[CharacterSyncService] Unexpected error:', e);
            return { success: false, error: (e as Error).message };
        }
    },

    /**
     * Get all characters synced by a specific player (for cloud loading).
     */
    async getCharactersByPlayerName(playerName: string): Promise<SyncedCharacterSummary[]> {
        const { data, error } = await supabase
            .from('characters')
            .select('id, character_name, player_name, last_synced, setting_id')
            .eq('player_name', playerName.trim())
            .order('last_synced', { ascending: false });

        if (error) {
            console.error('[CharacterSyncService] Fetch by player error:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Get ALL characters across all campaigns (for Admin Master List).
     */
    async getAllCharacters(): Promise<SyncedCharacterSummary[]> {
        const { data, error } = await supabase
            .from('characters')
            .select('id, character_name, player_name, last_synced, setting_id')
            .order('last_synced', { ascending: false });

        if (error) {
            console.error('[CharacterSyncService] Fetch all error:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Get all characters synced to a specific campaign (for Admin view).
     */
    async getCharactersBySettingId(settingId: string): Promise<SyncedCharacterSummary[]> {
        const { data, error } = await supabase
            .from('characters')
            .select('id, setting_id, character_name, player_name, last_synced')
            .eq('setting_id', settingId)
            .order('last_synced', { ascending: false });

        if (error) {
            console.error('[CharacterSyncService] Fetch error:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Get a single character by ID (for Admin or Player detail view).
     */
    async getCharacterById(id: string): Promise<SyncedCharacter | null> {
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[CharacterSyncService] Fetch by ID error:', error);
            return null;
        }

        // Decompress images
        data.data = await this.processImages(data.data, 'decompress');

        return data;
    },

    /**
     * Delete a synced character (Admin only, if needed later).
     */
    async deleteCharacter(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('characters')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[CharacterSyncService] Delete error:', error);
            return false;
        }

        return true;
    },

    /**
     * Check if character sync table exists and is accessible.
     */
    async checkSyncAvailable(): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('characters')
                .select('id', { count: 'exact', head: true });

            return !error;
        } catch {
            return false;
        }
    },

    /**
     * Recursively process an object to compress/decompress image strings.
     */
    async processImages(obj: any, action: 'compress' | 'decompress'): Promise<any> {
        if (!obj || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            return Promise.all(obj.map(item => this.processImages(item, action)));
        }

        const processed: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                if (action === 'compress' && value.startsWith('data:image/')) {
                    const result = await ImageCompressionService.compressFull(value);
                    processed[key] = result.compressed;
                } else if (action === 'decompress' && value.startsWith('GZIP:')) {
                    processed[key] = ImageCompressionService.decompressFull(value);
                } else {
                    processed[key] = value;
                }
            } else if (typeof value === 'object') {
                processed[key] = await this.processImages(value, action);
            } else {
                processed[key] = value;
            }
        }
        return processed;
    }
};
