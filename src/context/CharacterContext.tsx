import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CharacterSheetData, LogEntry } from '../types';
import { INITIAL_DATA } from '../data/initialState';
import { migrateData } from '../utils/migrations';
import { calculateExperienceResults } from '../utils/mechanics';
import { validateCharacterData } from '../schemas/characterSchema';
import { useRules } from './RulesContext';
import { applyRulesToState } from '../utils/rulesAdapter';
import { reconcileRulesWithState } from '../utils/rulesReconciler';
import { ErrorService } from '../services/ErrorService';
import { CharacterSyncService } from '../services/CharacterSyncService';

// --- Context Definitions ---

interface CharacterStateContextType {
    data: CharacterSheetData;
    isSyncing: boolean;
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
    const { data, isSyncing } = useCharacterState();
    const actions = useCharacterActions();

    return useMemo(() => ({
        data,
        isSyncing,
        ...actions
    }), [data, isSyncing, actions]);
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
                ErrorService.handleError(e, { context: 'CharacterContext.Init', userMessage: "Erreur lors du chargement des données locales." });
                // Try to just migrate if validation fails, or fallback to initial
                try {
                    return migrateData(JSON.parse(saved));
                } catch (migrateError) {
                    ErrorService.handleError(migrateError, { context: 'CharacterContext.Init.Fallback', silent: true });
                    return INITIAL_DATA;
                }
            }
        }

        // For fresh initialization, use INITIAL_DATA directly without migration
        return JSON.parse(JSON.stringify(INITIAL_DATA));
    });

    const [isSyncing, setIsSyncing] = useState(false);

    // 2. Actions (Stable references via useCallback) - Moved up to avoid TS2448
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

            // Reconcile with current rules if available to ensure MJ definitions are applied
            const finalData = rules ? reconcileRulesWithState(validated, rules) : validated;

            setData(finalData);
            addLog("Données importées avec succès", 'success', 'settings');
        } catch (e) {
            ErrorService.handleError(e, { context: 'CharacterContext.Import', userMessage: "Le fichier importé est invalide." });
            addLog("Échec de l'import : les données sont malformées ou incompatibles", 'danger', 'settings');
        }
    }, [addLog, rules]);

    // 3. Effects
    useEffect(() => {
        localStorage.setItem('rpg-sheet-data', JSON.stringify(data));
    }, [data]);

    // 2a. Auto-Sync Effect (Cloud)
    // Runs when data changes, with a 10s debounce, if auto-sync is enabled.
    useEffect(() => {
        const syncInfo = data.syncInfo;
        if (!syncInfo?.isAutoSyncEnabled || !syncInfo?.syncId || !syncInfo?.settingId) {
            return;
        }

        const playerName = data.header?.player;
        const characterName = data.header?.name;
        if (!playerName || !characterName) {
            return;
        }

        const timer = setTimeout(async () => {
            console.log(`[CharacterContext] Auto-syncing character "${characterName}"...`);
            setIsSyncing(true);

            const result = await CharacterSyncService.syncCharacter(
                syncInfo.settingId!,
                playerName,
                characterName,
                data
            );

            if (result.success && result.syncId) {
                // Update lastSynced without triggering another sync
                // We use the functional update to ensure we don't overwrite concurrent changes
                setData(prev => {
                    // Only update if sync info exists and we haven't switched character/sync settings
                    if (prev.syncInfo?.syncId === syncInfo.syncId) {
                        return {
                            ...prev,
                            syncInfo: {
                                ...prev.syncInfo,
                                lastSynced: Date.now()
                            }
                        };
                    }
                    return prev;
                });
                addLog("Synchronisation automatique réussie", 'success', 'settings', 'auto-sync-success');
            } else if (result.error) {
                console.warn("[CharacterContext] Auto-sync failed:", result.error);
                // We don't use ErrorService.handleError here to avoid spamming the user
                // but we could log it silently.
                addLog("Échec de la synchronisation automatique", 'danger', 'settings', 'auto-sync-failure');
            }

            setIsSyncing(false);
        }, 10000); // 10 seconds debounce

        return () => clearTimeout(timer);
    }, [
        // Dependencies: anything that should trigger a sync
        data.header,
        data.attributes,
        data.skills,
        data.combat,
        data.counters,
        data.experience,
        data.page2,
        data.specializations,
        data.library,
        data.skillLibrary,
        // syncInfo changes but we only care about isAutoSyncEnabled change
        data.syncInfo?.isAutoSyncEnabled,
        data.syncInfo?.syncId,
        addLog // Add addLog to dependencies as it's used inside the effect
    ]);

    // 2b. Auto-Update Effect (Smart Re-Hydration)
    // When rules are loaded (and not null), we reconcile them with the current data.
    // This ensures that if the admin updated the rules (e.g. new skills), the user gets them
    // without needing a full reset.
    useEffect(() => {
        if (!rules) return;

        // Optimized Reconciliation:
        // Only reconcile if the rules version in the character data is different from the loaded rules version.
        // This prevents unnecessary re-renders and logic execution on every mount/update if rules haven't changed.
        if (data._rulesVersion === rules.version) {
            return;
        }

        setData(currentData => {
            // Double check inside the setter to ensure we are working with the latest state
            if (currentData._rulesVersion === rules.version) {
                return currentData;
            }

            try {
                const skillsBefore = Object.values(currentData.skills).flat().filter(s => s.name).length;
                console.log(`[CharacterContext] Reconciling with rules v${rules.version} (was v${currentData._rulesVersion}). Skills before: ${skillsBefore}`);

                const newData = reconcileRulesWithState(currentData, rules);

                const skillsAfter = Object.values(newData.skills).flat().filter(s => s.name).length;
                console.log(`[CharacterContext] Reconciliation complete. Skills after: ${skillsAfter}`);

                if (skillsAfter < skillsBefore && skillsBefore > 0) {
                    console.warn(`[CharacterContext] Skills count dropped from ${skillsBefore} to ${skillsAfter}! Check rules for missing definitions.`);
                }

                return newData;
            } catch (e) {
                ErrorService.handleError(e, { context: 'CharacterContext.Reconciliation', userMessage: "Erreur critique lors de la mise à jour des règles." });
                return currentData; // Prevent crash, keep old data
            }
        });

    }, [rules, data._rulesVersion]);

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
        data.page2.avantages,
        data.page2.desavantages,
        data.library,
        data.counters,
        data.xpCosts,
        data.creationConfig,
        rules
    ]);

    // Actions were moved up

    // 5. Providers Wrapper
    const stateValue = useMemo(() => ({ data, isSyncing }), [data, isSyncing]);
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
