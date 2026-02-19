import { useState, useEffect } from 'react';
import { CharacterSyncService } from '../services/CharacterSyncService';
import { CharacterSheetData } from '../types/character';
import { logger } from '../utils/logger';

export interface CloudSyncStatus {
    hasUpdate: boolean;
    mjMessage?: string;
    cloudLastSynced?: number;
    isLoading: boolean;
}

/**
 * Hook to check if a newer version of the character exists in the cloud.
 */
export const useCloudSyncCheck = (characterData: CharacterSheetData) => {
    const [status, setStatus] = useState<CloudSyncStatus>({
        hasUpdate: false,
        isLoading: false
    });

    useEffect(() => {
        const syncInfo = characterData.syncInfo;

        // Only check if we have a syncId (meaning it was synced before)
        if (!syncInfo?.syncId) {
            return;
        }

        const checkUpdate = async () => {
            setStatus(prev => ({ ...prev, isLoading: true }));
            try {
                const cloudChar = await CharacterSyncService.getCharacterById(syncInfo.syncId!);

                if (cloudChar) {
                    const cloudLastSynced = new Date(cloudChar.last_synced).getTime();
                    const localLastSynced = syncInfo.lastSynced || 0;

                    if (import.meta.env.DEV) {
                        logger.log(`[useCloudSyncCheck] id: ${syncInfo.syncId}`, {
                            cloud: new Date(cloudLastSynced).toISOString(),
                            local: new Date(localLastSynced).toISOString(),
                            hasUpdate: cloudLastSynced > localLastSynced
                        });
                    }

                    // We consider it an update if the cloud version is newer than local
                    const hasUpdate = cloudLastSynced > localLastSynced;

                    setStatus({
                        hasUpdate,
                        mjMessage: cloudChar.data.syncInfo?.mjMessage,
                        cloudLastSynced,
                        isLoading: false
                    });
                } else {
                    setStatus(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                logger.error('Error checking cloud sync status:', error);
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        };

        checkUpdate();
    }, [characterData.syncInfo?.syncId, characterData.syncInfo?.lastSynced]);

    return status;
};
