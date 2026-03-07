/**
 * RealtimeService
 *
 * Gère les souscriptions Supabase Realtime (Postgres Changes via WebSocket).
 * Utilisé pour propager instantanément les modifications admin vers les fiches joueurs.
 *
 * Abonnements supportés :
 * - `game_settings` : changements de règles et de calendrier de campagne
 * - `characters`    : modifications directes de fiches par le MJ
 */
import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

type UpdateCallback = (payload: Record<string, unknown>) => void;

let settingChannel: RealtimeChannel | null = null;
let characterChannel: RealtimeChannel | null = null;
let appChannel: RealtimeChannel | null = null;

/**
 * S'abonne aux annonces de déploiement via Broadcast.
 * Permet une notification instantanée de mise à jour de l'application.
 */
export const subscribeToAppUpdates = (onUpdate: (version: string) => void): void => {
    if (appChannel) return; // Éviter les doubles souscriptions

    logger.log('[RealtimeService] Subscribing to app-deployments broadcast');

    appChannel = supabase
        .channel('app-deployments')
        .on('broadcast', { event: 'new-version' }, (payload) => {
            logger.log('[RealtimeService] App version broadcast received', payload);
            if (payload.payload?.version) {
                onUpdate(payload.payload.version);
            }
        })
        .subscribe((status) => {
            logger.log(`[RealtimeService] App deployments channel status: ${status}`);
        });
};

/**
 * S'abonne aux changements de la table `game_settings` pour un setting donné.
 * Appelle `onUpdate` à chaque UPDATE reçu via Realtime.
 */
export const subscribeToSetting = (settingId: string, onUpdate: UpdateCallback): void => {
    if (settingChannel) {
        supabase.removeChannel(settingChannel);
        settingChannel = null;
    }

    logger.log(`[RealtimeService] Subscribing to game_settings (id=${settingId})`);

    settingChannel = supabase
        .channel(`setting-${settingId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_settings',
                filter: `id=eq.${settingId}`,
            },
            (payload) => {
                logger.log('[RealtimeService] game_settings UPDATE received', payload);
                onUpdate(payload as Record<string, unknown>);
            }
        )
        .subscribe((status) => {
            logger.log(`[RealtimeService] game_settings channel status: ${status}`);
        });
};

/**
 * S'abonne aux changements de la table `characters` pour un personnage donné.
 * Appelle `onUpdate` à chaque UPDATE reçu via Realtime.
 */
export const subscribeToCharacter = (characterId: string, onUpdate: UpdateCallback): void => {
    if (characterChannel) {
        supabase.removeChannel(characterChannel);
        characterChannel = null;
    }

    logger.log(`[RealtimeService] Subscribing to characters (id=${characterId})`);

    characterChannel = supabase
        .channel(`character-${characterId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'characters',
                filter: `id=eq.${characterId}`,
            },
            (payload) => {
                logger.log('[RealtimeService] characters UPDATE received', payload);
                onUpdate(payload as Record<string, unknown>);
            }
        )
        .subscribe((status) => {
            logger.log(`[RealtimeService] characters channel status: ${status}`);
        });
};

/**
 * Désabonne tous les channels actifs. À appeler au démontage du composant racine.
 */
export const unsubscribeAll = (): void => {
    if (settingChannel) {
        supabase.removeChannel(settingChannel);
        settingChannel = null;
        logger.log('[RealtimeService] Unsubscribed from game_settings');
    }
    if (characterChannel) {
        supabase.removeChannel(characterChannel);
        characterChannel = null;
        logger.log('[RealtimeService] Unsubscribed from characters');
    }
    if (appChannel) {
        supabase.removeChannel(appChannel);
        appChannel = null;
        logger.log('[RealtimeService] Unsubscribed from app-deployments');
    }
};

export const RealtimeService = {
    subscribeToSetting,
    subscribeToCharacter,
    subscribeToAppUpdates,
    unsubscribeAll,
};
