import { useState, useCallback } from 'react';
import { CharacterSheetData } from '../types';
import { resetCharacterValues } from '../utils/characterUtils';

interface UseCreationModeReturn {
    showCreationWarning: boolean;
    handleToggleCreationMode: () => void;
    executeCreationActivation: () => void;
    setShowCreationWarning: (show: boolean) => void;
}

/**
 * Hook chirurgical pour extraire la logique de gestion du mode création.
 */
export const useCreationMode = (
    data: CharacterSheetData,
    onChange: (newData: CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void,
    onActivate?: () => void
): UseCreationModeReturn => {
    const [showCreationWarning, setShowCreationWarning] = useState(false);

    const handleToggleCreationMode = useCallback(() => {
        const isActive = data.creationConfig?.active;
        if (isActive) {
            onChange({
                ...data,
                creationConfig: {
                    ...data.creationConfig,
                    active: false
                }
            });
            onAddLog("Mode Création DÉSACTIVÉ", 'info', 'sheet');
        } else {
            setShowCreationWarning(true);
        }
    }, [data, onChange, onAddLog]);

    const executeCreationActivation = useCallback(() => {
        const resetData = resetCharacterValues(data);
        onChange({
            ...resetData,
            creationConfig: {
                ...resetData.creationConfig,
                active: true
            }
        });
        onAddLog("Mode Création ACTIVÉ - Fiche réinitialisée", 'success', 'sheet');
        setShowCreationWarning(false);
        if (onActivate) {
            onActivate();
        }
    }, [data, onChange, onAddLog, onActivate]);

    return {
        showCreationWarning,
        handleToggleCreationMode,
        executeCreationActivation,
        setShowCreationWarning
    };
};
