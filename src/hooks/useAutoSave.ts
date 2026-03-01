import { useState, useEffect } from 'react';
import { CharacterSheetData } from '../types';
import { CharacterSyncService } from '../services/CharacterSyncService';

// Time in seconds
const AUTO_SAVE_INTERVAL = 60;

export const useAutoSave = (
    data: CharacterSheetData,
    initialIsDirty: boolean, // Passed from layout if tracked elsewhere, or we track it here
    onSync: (mode: 'auto') => Promise<void>
) => {
    const [timeLeft, setTimeLeft] = useState(AUTO_SAVE_INTERVAL);
    const [isDirty, setIsDirty] = useState(false);

    // Detect changes with debounce to avoid heavy hashing on every keystroke
    useEffect(() => {
        const checkDirty = setTimeout(() => {
            if (!data.syncInfo?.lastSyncedHash) {
                // Not synced yet or orphan
                setIsDirty(true);
                return;
            }

            const currentHash = CharacterSyncService.generateDataHash(data);
            const isChanged = currentHash !== data.syncInfo.lastSyncedHash;

            if (isChanged && !isDirty) {
                setIsDirty(true);
                // On first modification, ensure we have a full timer
                setTimeLeft(AUTO_SAVE_INTERVAL);
            } else if (!isChanged && isDirty) {
                setIsDirty(false);
            }
        }, 1000); // 1s debounce for hash calculation

        return () => clearTimeout(checkDirty);
    }, [data, isDirty]);

    // Timer effect
    useEffect(() => {
        const isEnabled = data.syncInfo?.isAutoSyncEnabled;

        if (!isEnabled || !isDirty) {
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Trigger sync
                    onSync('auto');
                    return AUTO_SAVE_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [data.syncInfo?.isAutoSyncEnabled, isDirty, onSync]);

    return {
        countdown: (data.syncInfo?.isAutoSyncEnabled && isDirty) ? timeLeft : undefined,
        isDirty
    };
};
