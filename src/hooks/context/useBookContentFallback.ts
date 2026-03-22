/**
 * useBookContentFallback
 *
 * S'exécute une seule fois au montage du CharacterProvider.
 * Si data.bookDocument.content est absent/vide (ex: après un redémarrage),
 * tente de le restaurer depuis le stockage IndexedDB via BookStorageService.
 */

import { useEffect, useRef } from 'react';
import { CharacterSheetData } from '../../types';
import { BookStorageService } from '../../services/BookStorageService';
import { logger } from '../../utils/logger';

export const useBookContentFallback = (
    data: CharacterSheetData,
    updateData: (updater: (prev: CharacterSheetData) => CharacterSheetData, isSyncAction?: boolean) => void
) => {
    const hasRun = useRef(false);

    useEffect(() => {
        // N'exécuter qu'une seule fois, et seulement si le contenu est absent
        if (hasRun.current) return;
        if (data.bookDocument?.content && Object.keys(data.bookDocument.content).length > 0) return;

        hasRun.current = true;

        const tryFallback = async () => {
            const savedContent = await BookStorageService.loadBookContent();
            if (!savedContent) return;

            logger.log('[CharacterContext] Restauration du journal depuis le fallback IndexedDB.');

            updateData(prev => {
                // Vérifier à nouveau — une mise à jour concurrente a peut-être déjà injecté le contenu
                if (prev.bookDocument?.content && Object.keys(prev.bookDocument.content).length > 0) {
                    return prev;
                }
                const now = new Date().toISOString();
                return {
                    ...prev,
                    bookDocument: {
                        id: prev.bookDocument?.id ?? Math.random().toString(36).substring(2, 9),
                        formatVersion: prev.bookDocument?.formatVersion ?? 2,
                        createdAt: prev.bookDocument?.createdAt ?? now,
                        updatedAt: now,
                        content: savedContent,
                    },
                };
            }, true); // isSyncAction = true : pas de dirty flag
        };

        tryFallback();
    }, []); // Intentionnellement vide : exécution unique au montage
};
