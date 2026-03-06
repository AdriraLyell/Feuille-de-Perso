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

                    // Calculate hash of remote data to see if it's actually different from what we just synced
                    const cloudHash = CharacterSyncService.generateDataHash(cloudChar.data);
                    const localHash = CharacterSyncService.generateDataHash(characterData);

                    if (import.meta.env.DEV) {
                        logger.log(`[useCloudSyncCheck] id: ${syncInfo.syncId}`, {
                            cloud: new Date(cloudLastSynced).toISOString(),
                            local: new Date(localLastSynced).toISOString(),
                            cloudHash,
                            localHash,
                            isHashDifferent: cloudHash !== localHash
                        });
                    }

                    // We consider it an update ONLY if the content is different AND cloud is newer
                    // (The hash check covers the "echo" problem after a manual save)
                    const hasUpdate = cloudHash !== localHash && cloudLastSynced > (localLastSynced + 5000);

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
