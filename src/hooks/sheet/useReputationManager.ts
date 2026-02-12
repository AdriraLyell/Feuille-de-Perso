import { useState, useEffect, useCallback } from 'react';
import { CharacterSheetData, ReputationEntry } from '../../types';

export const useReputationManager = (
    data: CharacterSheetData,
    onChange: (newData: CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', detail?: string) => void
) => {
    const [focusNewReputation, setFocusNewReputation] = useState<number | null>(null);

    useEffect(() => {
        if (focusNewReputation !== null) {
            const element = document.getElementById(`rep-row-${focusNewReputation}-rep`);
            if (element) {
                element.focus();
                setFocusNewReputation(null);
            }
        }
    }, [focusNewReputation, data.page2.reputation]);

    const updateReputationEntry = useCallback((index: number, key: keyof ReputationEntry, value: string) => {
        const newList = [...data.page2.reputation];
        newList[index] = { ...newList[index], [key]: value };
        onChange({ ...data, page2: { ...data.page2, reputation: newList } });
        onAddLog(`Modification Réputation`, 'info', 'sheet', `reputation_${index}_${String(key)}`);
    }, [data.page2.reputation, data, onChange, onAddLog]);

    const handleReputationKeyDown = useCallback((e: React.KeyboardEvent, index: number, field: 'reputation' | 'lieu' | 'valeur') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (field === 'reputation') document.getElementById(`rep-row-${index}-lieu`)?.focus();
            else if (field === 'lieu') document.getElementById(`rep-row-${index}-val`)?.focus();
            else if (field === 'valeur' && index < data.page2.reputation.length - 1) document.getElementById(`rep-row-${index + 1}-rep`)?.focus();
        }
    }, [data.page2.reputation.length]);

    return {
        updateReputationEntry,
        handleReputationKeyDown,
        setFocusNewReputation
    };
};
