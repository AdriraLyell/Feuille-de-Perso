import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CharacterSheetData, LogEntry, XPTransaction } from '../types';
import { getInitialCharacterData, INITIAL_DATA } from '../data/initialState';
import { migrateData } from '../utils/migrations';
import { calculateExperienceResults } from '../utils/mechanics';
import { validateCharacterData } from '../schemas/characterSchema';
import { useRules } from './RulesContext';
import { applyRulesToState } from '../utils/rulesAdapter';
import { reconcileRulesWithState } from '../utils/rulesReconciler';
import { ErrorService } from '../services/ErrorService';
import { CharacterSyncService } from '../services/CharacterSyncService';
import { migrateBookImages } from '../utils/migrations/migrateBookImages';
import { logger } from '../utils/logger';


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
    sync: (mode?: 'manual' | 'auto') => Promise<void>;
    recordXPTransaction: (transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => void;
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

                // Restore Local Settings
                if (validated.syncInfo?.localSettings) {
                    const { expertMode, activeRulesId } = validated.syncInfo.localSettings;
                    if (expertMode !== undefined) localStorage.setItem('rpg-sheet-expert-mode', String(expertMode));
                    if (activeRulesId !== undefined) localStorage.setItem('rules-source-id', activeRulesId);
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

        // For fresh initialization, use getInitialCharacterData directly to ensure unique IDs
        return getInitialCharacterData();
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

    const recordXPTransaction = useCallback((transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => {
        setData(prev => {
            const newTransaction: XPTransaction = {
                ...transaction,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString()
            };
            return {
                ...prev,
                xpTransactions: [newTransaction, ...(prev.xpTransactions || [])]
            };
        });
    }, []);

    const resetData = useCallback(() => {
        // Use factory to get fresh IDs
        const base = getInitialCharacterData();
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
            const sanitizedData = {
                ...validated,
                mysticAbilities: validated.mysticAbilities || []
            } as CharacterSheetData;
            const finalData = rules ? reconcileRulesWithState(sanitizedData, rules) : sanitizedData;

            // Restore Local Settings from Imported Data
            if (finalData.syncInfo?.localSettings) {
                const { expertMode, activeRulesId } = finalData.syncInfo.localSettings;
                if (expertMode !== undefined) localStorage.setItem('rpg-sheet-expert-mode', String(expertMode));
                if (activeRulesId !== undefined) localStorage.setItem('rules-source-id', activeRulesId);
            }

            setData(finalData);
            addLog("Données importées avec succès", 'success', 'settings');
        } catch (e) {
            ErrorService.handleError(e, { context: 'CharacterContext.Import', userMessage: "Le fichier importé est invalide." });
            addLog("Échec de l'import : les données sont malformées ou incompatibles", 'danger', 'settings');
        }
    }, [addLog, rules]);

    const sync = useCallback(async (mode: 'manual' | 'auto' = 'manual') => {
        const syncInfo = data.syncInfo;
        // If auto mode but auto-sync is disabled, do nothing
        if (mode === 'auto' && !syncInfo?.isAutoSyncEnabled) return;

        if (!syncInfo?.syncId || !syncInfo?.settingId) {
            if (mode === 'manual') addLog("Pas de synchronisation configurée", 'danger', 'settings');
            return;
        }

        const playerName = data.header?.player;
        const characterName = data.header?.name;
        if (!playerName || !characterName) {
            if (mode === 'manual') addLog("Nom du joueur ou du personnage manquant", 'danger', 'settings');
            return;
        }

        setIsSyncing(true);
        if (mode === 'manual') addLog("Synchronisation en cours...", 'info', 'settings', 'sync-start');

        try {
            const result = await CharacterSyncService.syncCharacter(
                syncInfo.settingId,
                playerName,
                characterName,
                data,
                mode
            );

            if (result.success && result.syncId) {
                const newHash = result.hash;
                setData(prev => {
                    if (prev.syncInfo?.syncId === syncInfo.syncId) {
                        return {
                            ...prev,
                            syncInfo: {
                                ...prev.syncInfo,
                                lastSynced: Date.now(),
                                lastSyncedHash: newHash,
                                syncMode: mode // Update local state too
                            }
                        };
                    }
                    return prev;
                });

                if (mode === 'manual') {
                    addLog("Synchronisation réussie", 'success', 'settings', 'sync-success');
                } else {
                    logger.log(`[CharacterContext] Auto-sync success (Hash: ${newHash})`);
                }
            } else if (result.error) {
                if (mode === 'manual') {
                    logger.warn("[CharacterContext] Sync failed:", result.error);
                    addLog(`Échec de la synchronisation : ${result.error}`, 'danger', 'settings', 'sync-failure');
                }
            }
        } catch (e) {
            if (mode === 'manual') {
                logger.error("[CharacterContext] Sync exception:", e);
                addLog("Erreur critique lors de la synchronisation", 'danger', 'settings');
            }
        } finally {
            setIsSyncing(false);
        }
    }, [data, addLog]);

    // 3. Effects
    useEffect(() => {
        // Prepare data with latest local settings before saving
        const expertMode = localStorage.getItem('rpg-sheet-expert-mode') === 'true';
        const activeRulesId = localStorage.getItem('rules-source-id') || undefined;

        const dataWithSettings = {
            ...data,
            syncInfo: {
                ...data.syncInfo,
                localSettings: {
                    expertMode,
                    activeRulesId
                }
            }
        };

        localStorage.setItem('rpg-sheet-data', JSON.stringify(dataWithSettings));
    }, [data]);

    // 4. Image Migration Effect (Base64 -> IndexedDB)
    // Runs when bookDocument changes (e.g. after load or import)
    useEffect(() => {
        if (!data.bookDocument?.content) return;

        const processImages = async () => {
            try {
                const currentContent = data.bookDocument!.content;
                const migratedContent = await migrateBookImages(currentContent);

                // Compare to skip update if nothing changed
                if (JSON.stringify(migratedContent) !== JSON.stringify(currentContent)) {
                    logger.log("[CharacterContext] Book images migrated to IndexedDB.");
                    setData(prev => ({
                        ...prev,
                        bookDocument: {
                            ...prev.bookDocument!,
                            content: migratedContent,
                            updatedAt: new Date().toISOString()
                        }
                    }));
                }
            } catch (err) {
                logger.error("[CharacterContext] Image migration failed:", err);
            }
        };

        processImages();
    }, [data.bookDocument?.id]);



    // 2b. Auto-Update Effect (Smart Re-Hydration)
    // When rules are loaded (and not null), we reconcile them with the current data.
    // This ensures that if the admin updated the rules (e.g. new skills), the user gets them
    // without needing a full reset.
    useEffect(() => {
        if (!rules) return;

        // Optimized Reconciliation:
        // Reconcile if either the version ID or the last updated timestamp has changed.
        // This ensures updates are caught even if the semantic version string isn't manually bumped.
        if (data._rulesVersion === rules.version && data._rulesLastUpdated === rules.lastUpdated) {
            return;
        }

        setData(currentData => {
            if (currentData._rulesVersion === rules.version && currentData._rulesLastUpdated === rules.lastUpdated) {
                return currentData;
            }

            try {
                const skillsBefore = Object.values(currentData.skills).flat().filter(s => s.name).length;
                logger.log(`[CharacterContext] Reconciling with rules v${rules.version} (last updated: ${rules.lastUpdated}). Skills before: ${skillsBefore}`);

                const newData = reconcileRulesWithState(currentData, rules);
                newData._rulesLastUpdated = rules.lastUpdated;

                const skillsAfter = Object.values(newData.skills).flat().filter(s => s.name).length;
                logger.log(`[CharacterContext] Reconciliation complete. Skills after: ${skillsAfter}`);

                if (skillsAfter < skillsBefore && skillsBefore > 0) {
                    logger.warn(`[CharacterContext] Skills count dropped from ${skillsBefore} to ${skillsAfter}! Check rules for missing definitions.`);
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

    // Actions were moved up

    // 5. Providers Wrapper
    const stateValue = useMemo(() => ({ data, isSyncing }), [data, isSyncing]);
    const actionsValue = useMemo(() => ({
        updateData,
        addLog,
        resetData,
        importData,
        sync,
        recordXPTransaction
    }), [updateData, addLog, resetData, importData, sync, recordXPTransaction]);

    return (
        <CharacterStateContext.Provider value={stateValue}>
            <CharacterActionsContext.Provider value={actionsValue}>
                {children}
            </CharacterActionsContext.Provider>
        </CharacterStateContext.Provider>
    );
};
