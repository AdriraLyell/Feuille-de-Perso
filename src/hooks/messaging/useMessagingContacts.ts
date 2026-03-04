/**
 * useMessagingContacts
 *
 * Construit la liste des contacts disponibles pour la messagerie,
 * en récupérant les autres personnages de la même campagne.
 */
import { useState, useEffect } from 'react';
import { CharacterSyncService, SyncedCharacterSummary } from '../../services/CharacterSyncService';
import { logger } from '../../utils/logger';

interface Contact {
    id: string;
    name: string;
    type: 'group' | 'gm' | 'player';
}

interface UseMessagingContactsOptions {
    settingId: string;
    viewerId: string;       // ID du perso courant (exclu de la liste)
    isGM?: boolean;         // Si vrai, on n'ajoute pas le canal "MJ" dans les contacts
}

export const useMessagingContacts = ({
    settingId,
    viewerId,
    isGM = false,
}: UseMessagingContactsOptions): Contact[] => {
    const [players, setPlayers] = useState<SyncedCharacterSummary[]>([]);

    useEffect(() => {
        if (!settingId) return;
        CharacterSyncService.getCharactersBySettingId(settingId)
            .then((data) => setPlayers(data))
            .catch((err) => logger.error('[useMessagingContacts] error', err));
    }, [settingId]);

    const contacts: Contact[] = [
        // Canal général (tous)
        { id: 'ALL', name: 'Général (Groupe)', type: 'group' },
    ];

    // Canal MJ (uniquement pour les joueurs, pas pour le MJ lui-même)
    if (!isGM) {
        contacts.push({ id: 'GM', name: 'Meneur de Jeu', type: 'gm' });
    }

    // Autres joueurs de la campagne
    players
        .filter((p) => p.id !== viewerId)
        .forEach((p) => {
            contacts.push({
                id: p.id,
                name: p.character_name,
                type: 'player',
            });
        });

    return contacts;
};
