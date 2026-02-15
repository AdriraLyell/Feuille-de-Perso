import { useState, useCallback } from 'react';
import { RulesData } from '../../types/rules';
import { useAttributePresets } from './useAttributePresets';
import { useAttributeStructure } from './useAttributeStructure';

export const useAttributeEditor = (rules: RulesData, onUpdate: (newRules: RulesData) => void) => {
    // --- CONFIRMATION STATE ---
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info' | 'success';
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        type: 'info'
    });

    const closeConfirm = useCallback(() => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const requestConfirm = useCallback((title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') => {
        setConfirmState({ isOpen: true, title, message, onConfirm, type });
    }, []);

    // --- STRUCTURE LOGIC ---
    const {
        categories,
        attributesMap,
        secondaryMap,
        labelsMap,
        addCategory,
        removeCategory,
        toggleSecondaryGlobal,
        updateSecondaryItemName,
        updateLabel,
        addAttribute,
        removeAttribute,
        updateItemName
    } = useAttributeStructure({
        rules,
        onUpdate,
        requestConfirm
    });

    // --- PRESETS LOGIC ---
    const {
        showPresetConfirm,
        setShowPresetConfirm,
        pendingPreset,
        setPendingPreset,
        dbPresets,
        isLoadingPresets,
        requestPresetLoad,
        handleSaveCurrentAsPreset,
        handleDeletePreset,
        handleUpdatePreset,
        executePresetLoad
    } = useAttributePresets({
        rules,
        onUpdate,
        categories,
        labelsMap,
        attributesMap,
        secondaryMap,
        requestConfirm
    });

    return {
        categories,
        attributesMap,
        secondaryMap,
        labelsMap,
        states: {
            showPresetConfirm,
            setShowPresetConfirm,
            pendingPreset,
            setPendingPreset,
            dbPresets,
            isLoadingPresets,
            confirmState,
            closeConfirm
        },
        actions: {
            addCategory,
            removeCategory,
            updateLabel,
            addAttribute,
            removeAttribute,
            updateItemName,
            toggleSecondaryGlobal,
            updateSecondaryItemName,
            requestPresetLoad,
            executePresetLoad,
            handleSaveCurrentAsPreset,
            handleDeletePreset,
            handleUpdatePreset
        }
    };
};
