import { useState, useEffect, useCallback } from 'react';
import { CharacterSheetData } from '../../types';
import { getInitialCharacterData, INITIAL_DATA } from '../../data/initialState';
import { applyRulesToState } from '../../utils/rulesAdapter';
import { RulesData } from '../../types/rules';

export const useSettingsManager = (
    initialData: CharacterSheetData,
    rules: RulesData | null,
    isOnlineMode: boolean,
    expertMode: boolean,
    onUpdate: (newData: CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void,
    onDirtyChange?: (isDirty: boolean) => void
) => {
    const [localData, setLocalData] = useState<CharacterSheetData>(initialData);
    const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'skills' | 'specializations' | 'creation' | 'library' | 'cloud' | 'suggestions' | 'formulas'>('library');
    const [isDirty, setIsDirty] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showExpertWarning, setShowExpertWarning] = useState(false);

    // Helper to compare data excluding volatile/computed fields
    const getComparableData = useCallback((d: CharacterSheetData) => {
        const {
            appLogs,
            xpLogs,
            experience,
            syncInfo,
            appVersion,
            _rulesVersion,
            _schemaVersion,
            suggestions,
            ...rest
        } = d;
        return rest;
    }, []);

    // Effect to detect unsaved changes
    useEffect(() => {
        const dirty = JSON.stringify(getComparableData(localData)) !== JSON.stringify(getComparableData(initialData));
        setIsDirty(dirty);
        if (onDirtyChange) {
            onDirtyChange(dirty);
        }
    }, [localData, initialData, onDirtyChange, getComparableData]);

    // Force Tab to Library if entering Online Mode without Expert Mode
    useEffect(() => {
        const advancedTabs = ['attributes', 'skills', 'specializations', 'creation', 'formulas'];
        if (isOnlineMode && !expertMode && advancedTabs.includes(activeTab)) {
            setActiveTab('library');
        }
    }, [isOnlineMode, expertMode, activeTab]);

    const handleSave = useCallback(() => {
        onUpdate(localData);
        onAddLog('Modifications de la structure sauvegardées', 'success', 'settings');
    }, [localData, onUpdate, onAddLog]);

    const handleLocalUpdate = useCallback((newData: CharacterSheetData) => {
        setLocalData(newData);
    }, []);

    const performReset = useCallback(() => {
        // Use factory to get fresh IDs
        const base = getInitialCharacterData();
        const newState = rules ? applyRulesToState(base, rules) : base;

        setLocalData(newState);
        onUpdate(newState);
        setShowResetConfirm(false);

        const logMsg = rules
            ? `Réinitialisation complète (Règles chargées : v${rules.version})`
            : "Réinitialisation complète des données (Règles par défaut)";
        onAddLog(logMsg, 'danger', 'settings');
    }, [rules, onUpdate, onAddLog]);

    const toggleAutoSync = useCallback((enabled: boolean) => {
        if (!localData.syncInfo) return;
        handleLocalUpdate({
            ...localData,
            syncInfo: {
                ...localData.syncInfo,
                isAutoSyncEnabled: enabled
            }
        });
    }, [localData, handleLocalUpdate]);

    return {
        localData,
        activeTab,
        setActiveTab,
        isDirty,
        showResetConfirm,
        setShowResetConfirm,
        showExpertWarning,
        setShowExpertWarning,
        handleSave,
        handleLocalUpdate,
        performReset,
        toggleAutoSync
    };
};
