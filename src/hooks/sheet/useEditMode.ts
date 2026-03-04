import { useState, useCallback } from 'react';

export const useEditMode = (isEditMode: boolean, setIsEditMode: (v: boolean) => void) => {
    const [showEditWarning, setShowEditWarning] = useState(false);

    const handleToggleEditMode = useCallback(() => {
        if (!isEditMode) {
            setShowEditWarning(true);
        } else {
            setIsEditMode(false);
        }
    }, [isEditMode, setIsEditMode]);

    const executeEditModeActivation = () => {
        setIsEditMode(true);
        setShowEditWarning(false);
    };

    return {
        isEditMode,
        setIsEditMode,
        showEditWarning,
        setShowEditWarning,
        handleToggleEditMode,
        executeEditModeActivation
    };
};
