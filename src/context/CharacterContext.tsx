import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CharacterSheetData, LogEntry } from '../types';
import { INITIAL_DATA } from '../data/initialState';
import { migrateData } from '../utils/migrations';
import { calculateExperienceResults } from '../utils/mechanics';

// --- Context Definition ---

interface CharacterContextType {
    data: CharacterSheetData;
    updateData: (newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData)) => void;
    addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
    resetData: () => void;
    importData: (newData: CharacterSheetData) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

// --- Hook ---

export const useCharacter = () => {
    const context = useContext(CharacterContext);
    if (!context) {
        throw new Error('useCharacter must be used within a CharacterProvider');
    }
    return context;
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
                const migrated = migrateData(JSON.parse(saved));
                // Ensure creation mode isn't accidentally active on reload if undesired
                // (Optional choice, keeping faithful to App.tsx logic)
                if (migrated.creationConfig) {
                    // We might want to keep it false to prevent accidents, or true if user was working.
                    // App.tsx set it to false.
                    migrated.creationConfig.active = false;
                }
                return migrated;
            } catch (e) {
                console.error("Error migrating data", e);
                return INITIAL_DATA;
            }
        }
        // New User
        return migrateData(JSON.parse(JSON.stringify(INITIAL_DATA)));
    });

    // 2. Persistence Effect
    useEffect(() => {
        localStorage.setItem('rpg-sheet-data', JSON.stringify(data));
    }, [data]);

    // 3. XP Calculation Effect
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

    // 4. Actions
    const updateData = useCallback((newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData)) => {
        setData(newData);
    }, []);

    const addLog = useCallback((message: string, type: 'success' | 'danger' | 'info' = 'info', category: 'sheet' | 'settings' | 'both' = 'sheet', deduplicationId?: string) => {
        setData(prev => {
            const logs = prev.appLogs || [];
            const lastLog = logs[0];

            // Deduplication logic
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
        setData(newData);
        addLog("Données importées avec succès", 'success', 'settings');
    }, [addLog]);

    const value = {
        data,
        updateData,
        addLog,
        resetData,
        importData
    };

    return (
        <CharacterContext.Provider value={value}>
            {children}
        </CharacterContext.Provider>
    );
};
