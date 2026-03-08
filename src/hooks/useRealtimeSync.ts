/**
 * useRealtimeSync
 *
 * Hook React qui s'abonne aux changements Supabase Realtime pour propaguer
 * instantanément les modifications admin (calendrier, règles, fiche) vers la fiche joueur.
 *
 * - Ne s'active que si `isOnlineMode === true` (safe offline)
 * - Debounce de 500ms pour éviter les appels API en rafale
 * - Cleanup automatique au démontage
 */
import { useEffect, useRef } from 'react';
import { RealtimeService } from '../services/RealtimeService';
import { logger } from '../utils/logger';

interface UseRealtimeSyncParams {
    settingId?: string | null;
    characterId?: string | null;
    isOnlineMode: boolean;
    reloadRules: () => Promise<void>;
    addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void;
    onRemoteCharacterUpdate?: (newData: Record<string, unknown>) => void;
}

export const useRealtimeSync = ({
    settingId,
    characterId,
    isOnlineMode,
    reloadRules,
    addLog,
    onRemoteCharacterUpdate,
}: UseRealtimeSyncParams): void => {
    // Debounce refs pour éviter les appels en rafale
    const settingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const characterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Ne rien faire en mode offline
        if (!isOnlineMode || !settingId) {
            return;
        }

        const handleSettingUpdate = () => {
            if (settingDebounceRef.current) clearTimeout(settingDebounceRef.current);
            settingDebounceRef.current = setTimeout(async () => {
                logger.log('[useRealtimeSync] game_settings changed — reloading rules...');
                try {
                    await reloadRules();
                    addLog('🔔 Le MJ a modifié la configuration de la campagne.', 'info', 'settings');
                } catch (e) {
                    logger.error('[useRealtimeSync] Failed to reload rules after Realtime event', e);
                }
            }, 500);
        };

        RealtimeService.subscribeToSetting(settingId, handleSettingUpdate);

        return () => {
            if (settingDebounceRef.current) clearTimeout(settingDebounceRef.current);
            RealtimeService.unsubscribeAll();
        };
    }, [settingId, isOnlineMode]);

    useEffect(() => {
        // Ne rien faire en mode offline ou sans ID de personnage synchronisé
        if (!isOnlineMode || !characterId) {
            return;
        }

        const handleCharacterUpdate = (payload: Record<string, unknown>) => {
            if (characterDebounceRef.current) clearTimeout(characterDebounceRef.current);
            characterDebounceRef.current = setTimeout(() => {
                logger.log('[useRealtimeSync] characters changed — notifying layout...');
                try {
                    const newRow = (payload as { new?: Record<string, unknown> }).new as (Record<string, any> | undefined);
                    const rawData = newRow?.data;

                    if (rawData && onRemoteCharacterUpdate) {
                        // Enrich with SQL columns to avoid state loss in syncInfo
                        const newData = {
                            ...rawData,
                            syncInfo: {
                                ...(rawData.syncInfo || {}),
                                syncId: newRow.id,
                                settingId: newRow.setting_id || 'orphan',
                                lastSynced: newRow.last_synced ? new Date(newRow.last_synced).getTime() : Date.now()
                            }
                        };
                        onRemoteCharacterUpdate(newData);
                    }
                } catch (e) {
                    logger.error('[useRealtimeSync] Failed to process character update', e);
                }
            }, 500);
        };

        RealtimeService.subscribeToCharacter(characterId, handleCharacterUpdate);

        return () => {
            if (characterDebounceRef.current) clearTimeout(characterDebounceRef.current);
        };
    }, [characterId, isOnlineMode]);
};
