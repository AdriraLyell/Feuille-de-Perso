import { useCallback } from 'react';
import { CharacterSheetData } from '../../types/character';

export const useHeaderActions = (
    onChange: (update: (prev: CharacterSheetData) => CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void
) => {
    const updateHeader = useCallback((field: keyof CharacterSheetData['header'], value: string) => {
        onChange(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
        onAddLog(`En-tête modifiée : ${String(field)} = "${value}"`, 'info', 'sheet', `header_${String(field)}`);
    }, [onChange, onAddLog]);

    return { updateHeader };
};
