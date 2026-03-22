/**
 * BookStorageService
 *
 * Gère la persistance locale du contenu du journal (bookDocument.content)
 * dans IndexedDB via idb-keyval.
 *
 * Raison d'être : localStorage est limité à ~5 Mo et le flush `beforeunload`
 * n'est pas garanti lors d'un arrêt système. IndexedDB est persistant, sans
 * limite de taille pratique, et son accès est toujours asynchrone/fiable.
 */

import { get, set, del } from 'idb-keyval';
import { JSONContent } from '@tiptap/core';
import { logger } from '../utils/logger';

const BOOK_CONTENT_KEY = 'rpg-book-content';

export const BookStorageService = {

    /**
     * Sauvegarde le contenu Tiptap du journal en IndexedDB.
     * Fire-and-forget : ne doit pas bloquer le rendu.
     */
    async saveBookContent(content: JSONContent | undefined): Promise<void> {
        if (!content) return;
        try {
            await set(BOOK_CONTENT_KEY, content);
        } catch (err) {
            logger.error('[BookStorageService] Impossible de sauvegarder le journal en IDB:', err);
        }
    },

    /**
     * Charge le contenu du journal depuis IndexedDB.
     * Retourne null si aucun contenu n'est trouvé.
     */
    async loadBookContent(): Promise<JSONContent | null> {
        try {
            const content = await get<JSONContent>(BOOK_CONTENT_KEY);
            return content ?? null;
        } catch (err) {
            logger.error('[BookStorageService] Impossible de charger le journal depuis IDB:', err);
            return null;
        }
    },

    /**
     * Supprime le contenu du journal en IndexedDB.
     * Appelé lors du reset du personnage.
     */
    async clearBookContent(): Promise<void> {
        try {
            await del(BOOK_CONTENT_KEY);
        } catch (err) {
            logger.error('[BookStorageService] Impossible de supprimer le journal depuis IDB:', err);
        }
    },
};
