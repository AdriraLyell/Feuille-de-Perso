import { useState, useCallback } from 'react';
import { LibraryEntry } from '../types';
import { MergedEntry } from '../utils/libraryMerger';

export interface SelectedInstance {
    tempId: string;
    entry: LibraryEntry;
    variant?: string;
    cost?: string;
}

export const useTraitSelection = (onMultiSelect?: (instances: { entry: LibraryEntry; variant?: string; cost?: string }[]) => void) => {
    const [selection, setSelection] = useState<SelectedInstance[]>([]);
    const [variantPicker, setVariantPicker] = useState<LibraryEntry | null>(null);

    const isVariableCost = (entry: any) => {
        if (entry.isVariableCost || entry.is_variable_cost) return true;
        const label = entry.pointsLabel || entry.points_label || entry.cost;
        if (!label) return false;
        // Check for range characters or multiple values
        return /[-,–—,;]/.test(label) || label.includes('..');
    };

    const toggleSelection = useCallback((id: string, hybridList: MergedEntry<LibraryEntry>[]) => {
        const entry = hybridList.find(m => m.entry.id === id)?.entry;
        if (!entry) return;

        // Open configuration modal if it has variants OR variable cost
        if (entry.isVariable || (entry as any).is_variable || isVariableCost(entry)) {
            setVariantPicker(entry);
        } else {
            setSelection(prev => {
                const isAlreadySelected = prev.some(s => s.entry.id === id);
                if (isAlreadySelected) {
                    return prev.filter(s => s.entry.id !== id);
                } else {
                    return [...prev, { tempId: Math.random().toString(36).substr(2, 9), entry, cost: entry.cost || undefined }];
                }
            });
        }
    }, []);

    const addInstanceWithVariant = useCallback((entry: LibraryEntry, variant: string, cost?: string) => {
        setSelection(prev => [
            ...prev,
            { tempId: Math.random().toString(36).substr(2, 9), entry, variant, cost: cost || entry.cost || undefined }
        ]);
        setVariantPicker(null);
    }, []);

    const removeInstance = useCallback((tempId: string) => {
        setSelection(prev => prev.filter(s => s.tempId !== tempId));
    }, []);

    const handleConfirmMultiSelect = useCallback(() => {
        if (onMultiSelect) {
            onMultiSelect(selection.map(s => ({ entry: s.entry, variant: s.variant, cost: s.cost })));
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
