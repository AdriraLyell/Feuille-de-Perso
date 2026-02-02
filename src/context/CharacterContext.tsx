import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CharacterSheetData, LogEntry } from '../types';
import { INITIAL_DATA } from '../data/initialState';
import { migrateData } from '../utils/migrations';
import { calculateExperienceResults } from '../utils/mechanics';
import { validateCharacterData } from '../schemas/characterSchema';

// --- Context Definitions ---

interface CharacterStateContextType {
    data: CharacterSheetData;
}

interface CharacterActionsContextType {
    updateData: (newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData)) => void;
    addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
    resetData: () => void;
    importData: (newData: CharacterSheetData) => void;
}

const CharacterStateContext = createContext<CharacterStateContextType | undefined>(undefined);
const CharacterActionsContext = createContext<CharacterActionsContextType | undefined>(undefined);

// --- Hooks ---

/**
 * Hook pour accéder aux données du personnage.
 * Provoque un re-rendu quand les données changent.
 */
export const useCharacterData = () => {
    const context = useContext(CharacterStateContext);
    if (!context) {
        throw new Error('useCharacterData must be used within a CharacterProvider');
    }
    return context.data;
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
    const data = useCharacterData();
    const actions = useCharacterActions();

    return useMemo(() => ({
        data,
        ...actions
    }), [data, actions]);
};

// --- Provider ---

interface CharacterProviderProps {
    children: ReactNode;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({ children }) => {
    // 1. Initialize State from LocalStorage
    const [data, setData] = useState<CharacterSheetData>(() => {
        const saved = localStorage.getItem('rpg-sheet-data');

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const migrated = migrateData(parsed);

                // Validate after migration
                const validated = validateCharacterData(migrated);

                if (validated.creationConfig) {
                    validated.creationConfig.active = false;
                }
                return validated;
            } catch (e) {
                console.error("[Init] Error loading/validating data", e);
                // Try to just migrate if validation fails, or fallback to initial
                try {
                    return migrateData(JSON.parse(saved));
                } catch (migrateError) {
                    console.error("[Init] Migration fallback failed", migrateError);
                    return INITIAL_DATA;
                }
            }
        }

        // For fresh initialization, use INITIAL_DATA directly without migration
        return JSON.parse(JSON.stringify(INITIAL_DATA));
    });

    // 2. Persistence Effect
    useEffect(() => {
        localStorage.setItem('rpg-sheet-data', JSON.stringify(data));
    }, [data]);

    // 3. XP Calculation Effect (Remains here as it depends on data and changes data)
    useEffect(() => {
        const newExpState = calculateExperienceResults(data);

        if (data.experience.spent !== newExpState.spent ||
            data.experience.rest !== newExpState.rest ||
            data.experience.gain !== newExpState.gain) {

            setData(prev => ({
                ...prev,
                experience: {
                    ...prev.experience,
                    gain: newExpState.gain,
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
        data.creationConfig?.attributeCost,
        data.page2.avantages,
        data.page2.desavantages,
        data.library
    ]);

    // 4. Actions (Stable references via useCallback)
    const updateData = useCallback((newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData)) => {
        setData(newData);
    }, []);

    const addLog = useCallback((message: string, type: 'success' | 'danger' | 'info' = 'info', category: 'sheet' | 'settings' | 'both' = 'sheet', deduplicationId?: string) => {
        setData(prev => {
            const logs = prev.appLogs || [];
            const lastLog = logs[0];

            if (deduplicationId && lastLog && lastLog.deduplicationId === deduplicationId) {
                const updatedLog = {
                    ...lastLog,
                    message,
                    timestamp: new Date().toLocaleTimeString()
                };
                return { ...prev, appLogs: [updatedLog, ...logs.slice(1)] };
            }

            const newLog: LogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                message,
                type,
                category,
                deduplicationId
            };

            return { ...prev, appLogs: [newLog, ...logs] };
        });
    }, []);

    const resetData = useCallback(() => {
        setData(JSON.parse(JSON.stringify(INITIAL_DATA)));
        addLog("Réinitialisation complète des données", 'danger', 'settings');
    }, [addLog]);

    const importData = useCallback((newData: CharacterSheetData) => {
        try {
            const validated = validateCharacterData(newData);
            setData(validated);
            addLog("Données importées avec succès", 'success', 'settings');
        } catch (e) {
            console.error("Import validation failed", e);
            addLog("Échec de l'import : les données sont malformées ou incompatibles", 'danger', 'settings');
            // Show detail in console but don't crash the app
        }
    }, [addLog]);

    // 5. Providers Wrapper
    const stateValue = useMemo(() => ({ data }), [data]);
    const actionsValue = useMemo(() => ({
        updateData,
        addLog,
        resetData,
        importData
    }), [updateData, addLog, resetData, importData]);

    return (
        <CharacterStateContext.Provider value={stateValue}>
            <CharacterActionsContext.Provider value={actionsValue}>
                {children}
            </CharacterActionsContext.Provider>
        </CharacterStateContext.Provider>
    );
};
