import React, { createContext, useContext, useEffect, ReactNode, useMemo, useState, useCallback } from 'react';
import { CharacterSheetData, XPTransaction } from '../types';
import { SheetLayout } from '../hooks/useSheetLayout';
import { useCharacterStateManager } from '../hooks/context/useCharacterStateManager';
import { useCharacterSyncManager } from '../hooks/context/useCharacterSyncManager';
import { useCharacterImageMigration } from '../hooks/context/useCharacterImageMigration';
import { useRules } from './RulesContext';
import { calculateExperienceResults } from '../utils/mechanics';
import { loadInitialCharacterData } from '../utils/characterInit';

// --- Context Definitions ---

interface CharacterStateContextType {
    data: CharacterSheetData;
    isSyncing: boolean;
    isEditMode: boolean;
    editLayoutMode: boolean;
}

interface CharacterActionsContextType {
    updateData: (newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData)) => void;
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

export const useCharacterData = () => {
    return useCharacterState().data;
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

/**
 * Hook Legacy (compatibilité).
 * Regroupe données et actions.
 */
export const useCharacter = () => {
    const { data, isSyncing, isEditMode, editLayoutMode } = useCharacterState();
    const actions = useCharacterActions();

    return useMemo(() => ({
        data,
        isSyncing,
        isEditMode,
        editLayoutMode,
        ...actions
    }), [data, isSyncing, isEditMode, editLayoutMode, actions]);
};

// --- Provider ---

interface CharacterProviderProps {
    children: ReactNode;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({ children }) => {
    const { rules } = useRules();

    // 1. Initialize State
    const [data, setData] = useState<CharacterSheetData>(loadInitialCharacterData);

    // 2. Use the refactored logic hooks
    const { resetData, importData, isEditMode, setEditMode, clearLayout, autoFitLayout } = useCharacterStateManager(data, setData);
    const [editLayoutMode, setEditLayoutMode] = useState(false);
    const { isSyncing, addLog, recordXPTransaction, sync } = useCharacterSyncManager(data, setData);

    // Run image migration effect
    useCharacterImageMigration(data, setData);

    // XP Calculation Effect (Remains here as it depends on data and changes data)
    useEffect(() => {
        const newExpState = calculateExperienceResults(data, rules);

        if (data.experience.spent !== newExpState.spent ||
            data.experience.rest !== newExpState.rest ||
            data.experience.gain !== newExpState.gain ||
            data.experience.gainTooltip !== newExpState.gainTooltip) {

            setData(prev => ({
                ...prev,
                experience: {
                    ...prev.experience,
                    gain: newExpState.gain,
                    gainTooltip: newExpState.gainTooltip,
                    spent: newExpState.spent,
                    rest: newExpState.rest
                }
            }));
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
        rules
    ]);

    const updateData = useCallback((newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData)) => {
        setData(newData);
    }, []);

    // Providers Wrapper
    const stateValue = useMemo(() => ({ data, isSyncing, isEditMode, editLayoutMode }), [data, isSyncing, isEditMode, editLayoutMode]);
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