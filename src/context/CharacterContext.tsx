import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CharacterSheetData, LogEntry } from '../types';
import { INITIAL_DATA } from '../data/initialState';
import { migrateData } from '../utils/migrations';
import { calculateExperienceResults } from '../utils/mechanics';
import { validateCharacterData } from '../schemas/characterSchema';
import { useRules } from './RulesContext';
import { applyRulesToState } from '../utils/rulesAdapter';
import { reconcileRulesWithState } from '../utils/rulesReconciler';

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
    const { rules } = useRules();

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

    // 2b. Auto-Update Effect (Smart Re-Hydration)
    // When rules are loaded (and not null), we reconcile them with the current data.
    // This ensures that if the admin updated the rules (e.g. new skills), the user gets them
    // without needing a full reset.
    useEffect(() => {
        if (!rules) return;

        // We only want to run this if the data "needs" updating?
        // Actually, running it once when rules load is safe because reconciliation is non-destructive
        // for values, but it re-aligns structure.
        // However, we must be careful not to create an infinite loop if `setData` triggers this again.
        // `rules` is stable unless reloaded.

        setData(currentData => {
            // Check if we need to reconcile?
            // Simple check: compare versions or just do it.
            // "reconcileRulesWithState" creates a new object only if needed? 
            // Actually it always clones.
            // Let's rely on React state optimization if logic is sound.

            // To be safer and avoid unnecessary renders, we could check a version flag in data?
            // But reconciler is fast.

            try {
                const skillsBefore = Object.values(currentData.skills).flat().filter(s => s.name).length;
                console.log(`[CharacterContext] Reconciling with rules v${rules.version}. Skills before: ${skillsBefore}`);

                const newData = reconcileRulesWithState(currentData, rules);

                const skillsAfter = Object.values(newData.skills).flat().filter(s => s.name).length;
                console.log(`[CharacterContext] Reconciliation complete. Skills after: ${skillsAfter}`);

                if (skillsAfter < skillsBefore && skillsBefore > 0) {
                    console.warn(`[CharacterContext] Skills count dropped from ${skillsBefore} to ${skillsAfter}! Check rules for missing definitions.`);
                }

                return newData;
            } catch (e) {
                console.error("[CharacterContext] Critical error during reconciliation:", e);
                return currentData; // Prevent crash, keep old data
            }
        });

    }, [rules]);

    // 3. XP Calculation Effect (Remains here as it depends on data and changes data)
    useEffect(() => {
        const newExpState = calculateExperienceResults(data, rules);

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
        data.library,
        rules
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
        const base = JSON.parse(JSON.stringify(INITIAL_DATA));
        // Apply rules if available
        const newState = rules ? applyRulesToState(base, rules) : base;

        setData(newState);

        const logMsg = rules
            ? `Réinitialisation complète (Règles chargées : v${rules.version})`
            : "Réinitialisation complète des données (Règles par défaut)";

        addLog(logMsg, 'danger', 'settings');
    }, [addLog, rules]);

    const importData = useCallback((newData: CharacterSheetData) => {
        try {
            const migrated = migrateData(newData);
            const validated = validateCharacterData(migrated);
            setData(validated);
            addLog("Données importées avec succès", 'success', 'settings');
        } catch (e) {
            console.error("Import validation/migration failed", e);
            addLog("Échec de l'import : les données sont malformées ou incompatibles", 'danger', 'settings');
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
