import { useState, useCallback } from 'react';
import { LibraryEntry } from '../types';
import { MergedEntry } from '../utils/libraryMerger';

export interface SelectedInstance {
    tempId: string;
    entry: LibraryEntry;
    variant?: string;
}

export const useTraitSelection = (onMultiSelect?: (instances: { entry: LibraryEntry; variant?: string }[]) => void) => {
    const [selection, setSelection] = useState<SelectedInstance[]>([]);
    const [variantPicker, setVariantPicker] = useState<LibraryEntry | null>(null);

    const toggleSelection = useCallback((id: string, hybridList: MergedEntry<LibraryEntry>[]) => {
        const entry = hybridList.find(m => m.entry.id === id)?.entry;
        if (!entry) return;

        if (entry.isVariable) {
            setVariantPicker(entry);
        } else {
            setSelection(prev => {
                const isAlreadySelected = prev.some(s => s.entry.id === id);
                if (isAlreadySelected) {
                    return prev.filter(s => s.entry.id !== id);
                } else {
                    return [...prev, { tempId: Math.random().toString(36).substr(2, 9), entry }];
                }
            });
        }
    }, []);

    const addInstanceWithVariant = useCallback((entry: LibraryEntry, variant: string) => {
        setSelection(prev => [
            ...prev,
            { tempId: Math.random().toString(36).substr(2, 9), entry, variant }
        ]);
        setVariantPicker(null);
    }, []);

    const removeInstance = useCallback((tempId: string) => {
        setSelection(prev => prev.filter(s => s.tempId !== tempId));
    }, []);

    const handleConfirmMultiSelect = useCallback(() => {
        if (onMultiSelect) {
            onMultiSelect(selection.map(s => ({ entry: s.entry, variant: s.variant })));
            setSelection([]);
        }
    }, [onMultiSelect, selection]);

    return {
        selection,
        variantPicker,
        setVariantPicker,
        toggleSelection,
        addInstanceWithVariant,
        removeInstance,
        handleConfirmMultiSelect
    };
};
