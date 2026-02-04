import { useEffect, useRef, useState, useCallback } from 'react';
import { RulesData } from '../../types/rules';

export const usePersistence = (
    currentRules: RulesData | null
) => {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const initialLoadDone = useRef(false);

    // Track if rules change
    useEffect(() => {
        if (!currentRules) return;

        // If it's the very first load, we don't mark as changed
        if (!initialLoadDone.current) {
            initialLoadDone.current = true;
            return;
        }

        // Otherwise, any change means we are dirty
        setHasUnsavedChanges(true);
    }, [currentRules]);

    // Window BeforeUnload Protection
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const markAsSaved = useCallback(() => {
        setHasUnsavedChanges(false);
    }, []);

    const resetPersistence = useCallback(() => {
        setHasUnsavedChanges(false);
        initialLoadDone.current = false;
    }, []);

    return { hasUnsavedChanges, markAsSaved, resetPersistence };
};

