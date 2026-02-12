import { useState, useCallback } from 'react';

export const useEditMode = () => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [showEditWarning, setShowEditWarning] = useState(false);

    const handleToggleEditMode = useCallback(() => {
        if (!isEditMode) {
            setShowEditWarning(true);
        } else {
            setIsEditMode(false);
        }
    }, [isEditMode]);

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
