/**
 * BookSyncService
 *
 * Handles read/write of the character book (grimoire) via the dedicated
 * `character_books` table. The book content is never included in the main
 * character sync payload, which keeps syncs lightweight.
 */

import { supabase } from './supabase';
import { ErrorService } from './ErrorService';
import { JSONContent } from '@tiptap/core';

const TABLE = 'character_books' as const;

export interface CharacterBook {
    id: string;
    character_id: string;
    content: JSONContent;
    format_version: number;
    created_at: string;
    updated_at: string;
}

export const BookSyncService = {

    /**
     * Fetch the book for a given character_id.
     * Returns null if the character has no book yet.
     */
    async getBook(characterId: string): Promise<CharacterBook | null> {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .eq('character_id', characterId)
                .maybeSingle();

            if (error) throw error;
            return data as CharacterBook | null;
        } catch (e) {
            ErrorService.handleError(e, { context: 'BookSyncService.getBook' });
            return null;
        }
    },

    /**
     * Upsert the book content for a given character_id.
     * Creates the row if it does not exist, updates it if it does.
     * Returns the updated book row or null on error.
     */
    async saveBook(
        characterId: string,
        content: JSONContent,
        formatVersion = 2
    ): Promise<CharacterBook | null> {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(
                    {
                        character_id: characterId,
                        content,
                        format_version: formatVersion,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'character_id' }
                )
                .select()
                .single();

            if (error) throw error;
            return data as CharacterBook;
        } catch (e) {
            ErrorService.handleError(e, { context: 'BookSyncService.saveBook' });
            return null;
        }
    },

    /**
     * Delete the book for a given character_id.
     * Used when a character is deleted.
     */
    async deleteBook(characterId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq('character_id', characterId);

            if (error) throw error;
            return true;
        } catch (e) {
            ErrorService.handleError(e, { context: 'BookSyncService.deleteBook' });
            return false;
        }
    }
};
