import React, { createContext, useContext, useEffect, ReactNode, useMemo, useState, useCallback } from 'react';
import { CharacterSheetData, XPTransaction } from '../types';
import { SheetLayout } from '../hooks/useSheetLayout';
import { useCharacterStateManager } from '../hooks/context/useCharacterStateManager';
import { useCharacterSyncManager } from '../hooks/context/useCharacterSyncManager';
import { useCharacterImageMigration } from '../hooks/context/useCharacterImageMigration';
import { useBookContentFallback } from '../hooks/context/useBookContentFallback';
import { useResolvedCharacter } from '../hooks/context/useResolvedCharacter';
import { useRules } from './RulesContext';
import { calculateExperienceResults } from '../utils/mechanics';
import { loadInitialCharacterData } from '../utils/characterInit';
import { logger } from '../utils/logger';

// --- Context Definitions ---

interface CharacterStateContextType {
    data: CharacterSheetData;
    resolvedData: CharacterSheetData; // New: resolved data with rules applied for UI
    isSyncing: boolean;
    isEditMode: boolean;
    editLayoutMode: boolean;
}

interface CharacterActionsContextType {
    updateData: (newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData), isSyncAction?: boolean) => void;
    addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
    resetData: () => void;
    importData: (newData: CharacterSheetData) => void;
    sync: (mode?: 'manual' | 'auto') => Promise<void>;
    recordXPTransaction: (transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => void;
    setEditMode: (active: boolean) => void;
    setEditLayoutMode: (active: boolean) => void;
    clearLayout: (portrait: SheetLayout, landscape: SheetLayout) => void;
    autoFitLayout: (colCount: number, availableHeightRows: number) => void;
}

const CharacterStateContext = createContext<CharacterStateContextType | undefined>(undefined);
const CharacterActionsContext = createContext<CharacterActionsContextType | undefined>(undefined);

// --- Hooks ---

/**
 * Hook pour accéder aux données du personnage.
 * Provoque un re-rendu quand les données changent.
 */
export const useCharacterState = () => {
    const context = useContext(CharacterStateContext);
    if (!context) {
        throw new Error('useCharacterState must be used within a CharacterProvider');
    }
    return context;
};

/**
 * Hook for UI components to access resolved data (with official names/descriptions).
 */
export const useResolvedData = () => {
    return useCharacterState().resolvedData;
};

/**
 * Hook pour accéder aux actions de modification.
 * Ne provoque PAS de re-rendu quand les données changent (fonctions stables).
 */
export const useCharacterActions = () => {
    const context = useContext(CharacterActionsContext);
    if (!context) {
        throw new Error('useCharacterActions must be used within a CharacterProvider');
    }
    return context;
};

// --- Provider ---

interface CharacterProviderProps {
    children: ReactNode;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({ children }) => {
    const { rules, reloadRules } = useRules();

    // 1. Initialize State
    const [data, setData] = useState<CharacterSheetData>(loadInitialCharacterData);

    // --- Phase 1.5: Rules/Character Alignment ---
    // Ensure that if we loaded a character from a different campaign, we fetch the correct rules
    useEffect(() => {
        const charSettingId = data.syncInfo?.settingId;
        const currentRulesId = rules?.settingId;

        // Alignment logic: if character has a campaign ID but rules don't match or are empty/orphaned
        const needsReload = charSettingId && charSettingId !== 'orphan' && charSettingId !== currentRulesId;

        if (needsReload) {
            logger.log(`[CharacterContext] Campaign mismatch (Char: ${charSettingId}, Rules: ${currentRulesId}). Realigning...`);
            reloadRules(charSettingId);
        }
    }, [data.syncInfo?.settingId, rules?.settingId, reloadRules]);

    // 2. Runtime Resolution Hook (The "Brain")
    const resolvedData = useResolvedCharacter(data, rules);

    /**
     * Centralized update function that manages dirty flags and local timestamps.
     * @param isSyncAction If true, the update won't mark the data as dirty (e.g., successful sync from server).
     */
    const updateData = useCallback((newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData), isSyncAction = false) => {
        setData(prev => {
            const next = typeof newData === 'function' ? newData(prev) : newData;

            // If it's a regular user edit, mark as dirty and update timestamp
            if (!isSyncAction) {
                return {
                    ...next,
                    syncInfo: {
                        ...next.syncInfo,
                        lastLocalEdit: Date.now(),
                        isDirty: true
                    }
                };
            }
            return next;
        });
    }, []);

    // 3. Use the refactored logic hooks
    const { resetData, importData, isEditMode, setEditMode, clearLayout, autoFitLayout } = useCharacterStateManager(data, updateData);
    const [editLayoutMode, setEditLayoutMode] = useState(false);
    const { isSyncing, addLog, recordXPTransaction, sync } = useCharacterSyncManager(data, updateData);

    // Run image migration effect
    useCharacterImageMigration(data, updateData);
    // Run IDB fallback: restores journal if bookDocument is missing after a restart
    useBookContentFallback(data, updateData);

    // XP Calculation Effect (Remains here as it depends on data and changes data)
    useEffect(() => {
        const newExpState = calculateExperienceResults(data, rules);

        if (data.experience.spent !== newExpState.spent ||
            data.experience.rest !== newExpState.rest ||
            data.experience.gain !== newExpState.gain ||
            data.experience.gainTooltip !== newExpState.gainTooltip) {

            updateData(prev => ({
                ...prev,
                experience: {
                    ...prev.experience,
                    gain: newExpState.gain,
                    gainTooltip: newExpState.gainTooltip,
                    spent: newExpState.spent,
                    rest: newExpState.rest
                }
            }), true); // XP calc is an internal update, doesn't necessarily mean "dirty" if just re-calculated
        }
    }, [
        data.skills,
        data.attributes,
        data.secondaryAttributes,
        data.secondaryAttributesActive,
        data.xpLogs,
        data.attributeSettings,
        data.page2.avantages,
        data.page2.desavantages,
        data.library,
        data.counters,
        data.xpCosts,
        data.creationConfig,
        rules,
        updateData
    ]);

    // --- Phase 3: Automatic Sync Effect (Push-on-Connect & Safety Interval) ---
    useEffect(() => {
        if (!data.syncInfo?.syncId || isSyncing) return;

        const isDirty = data.syncInfo?.isDirty;
        const isAutoSync = data.syncInfo?.isAutoSyncEnabled;

        const handleSyncTrigger = (mode: 'auto' | 'manual') => {
            if (navigator.onLine) {
                sync(mode);
            }
        };

        // 1. Immediate "Push-on-Connect" (only if AutoSync is ON)
        if (isDirty && isAutoSync) {
            const timeout = setTimeout(() => handleSyncTrigger('auto'), 2000);
            window.addEventListener('online', () => handleSyncTrigger('auto'));
            return () => {
                clearTimeout(timeout);
                window.removeEventListener('online', () => handleSyncTrigger('auto'));
            };
        }

    }, [data.syncInfo?.isDirty, data.syncInfo?.isAutoSyncEnabled, data.syncInfo?.lastSynced, data.syncInfo?.syncId, isSyncing, sync]);

    // Providers Wrapper
    const stateValue = useMemo(() => ({ data, resolvedData, isSyncing, isEditMode, editLayoutMode }), [data, resolvedData, isSyncing, isEditMode, editLayoutMode]);
    const actionsValue = useMemo(() => ({
        updateData,
        addLog,
        resetData,
        importData,
        sync,
        recordXPTransaction,
        setEditMode,
        setEditLayoutMode,
        clearLayout,
        autoFitLayout
    }), [updateData, addLog, resetData, importData, sync, recordXPTransaction, setEditMode, setEditLayoutMode, clearLayout, autoFitLayout]);

    return (
        <CharacterStateContext.Provider value={stateValue}>
            <CharacterActionsContext.Provider value={actionsValue}>
                {children}
            </CharacterActionsContext.Provider>
        </CharacterStateContext.Provider>
    );
};