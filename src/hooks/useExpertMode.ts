import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'rpg-sheet-expert-mode';

/**
 * Hook to manage Expert Mode state with localStorage persistence.
 * Expert Mode allows access to advanced settings that could conflict with Admin rules.
 */
export const useExpertMode = () => {
    const [expertMode, setExpertModeState] = useState<boolean>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'true';
    });

    // Persist to localStorage when state changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(expertMode));
    }, [expertMode]);

    const enableExpertMode = useCallback(() => {
        setExpertModeState(true);
    }, []);

    const disableExpertMode = useCallback(() => {
        setExpertModeState(false);
    }, []);

    const toggleExpertMode = useCallback(() => {
        setExpertModeState(prev => !prev);
    }, []);

    return {
        expertMode,
        enableExpertMode,
        disableExpertMode,
        toggleExpertMode
    };
};
