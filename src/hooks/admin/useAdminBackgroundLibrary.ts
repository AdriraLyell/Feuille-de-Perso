import { useMemo, useCallback } from 'react';
import { RulesData } from '../../types/rules';
import { LibraryBackgroundEntry } from '../../types/system';
import { useAdminLibrary } from '../useAdminLibrary';
import { useNotification } from '../../context/NotificationContext';

export const useAdminBackgroundLibrary = (
    rules: RulesData,
    onUpdate: (newRules: RulesData) => void,
    globalUsage: Record<string, number> = {}
) => {
    const addLog = useNotification();

    const admin = useAdminLibrary<LibraryBackgroundEntry, RulesData>({
        data: rules,
        onUpdate,
        addLog,
        collectionKey: 'libraries.backgrounds',
        itemName: 'Historique',
        disableMerge: true
    });

    const list = admin.hybridList.map(m => m.entry);

    const placedNames = useMemo(() => {
        const names = new Set<string>();
        const bgCat = rules.definitions.skillCategories?.find(c => c.behavior === 'Arrière-plan')?.id || 'Col_Comp_8';
        const placed = rules.definitions.skills?.[bgCat] || [];
        placed.forEach(name => {
            if (name.trim()) names.add(name.trim().toLowerCase());
        });
        return names;
    }, [rules.definitions]);

    const handleOpenNew = useCallback(() => {
        admin.handleOpenNew({
            id: crypto.randomUUID(),
            name: '',
            description: '',
            isVariable: false
        });
    }, [admin]);

    const handleBulkSelect = useCallback((active: boolean) => {
        const visibleIds = new Set(admin.filteredLibrary.map(item => item.entry.id));
        const newList = list.map(item =>
            visibleIds.has(item.id) ? { ...item, isActive: active } : item
        );
        onUpdate({ ...rules, libraries: { ...rules.libraries, backgrounds: newList } });
    }, [admin.filteredLibrary, list, onUpdate, rules]);

    const toggleActive = useCallback((id: string, current: boolean) => {
        const newList = list.map(b => b.id === id ? { ...b, isActive: !current } : b);
        onUpdate({ ...rules, libraries: { ...rules.libraries, backgrounds: newList } });
    }, [list, onUpdate, rules]);

    const handleSave = useCallback(() => {
        if (admin.editingEntry) {
            admin.handleSave(admin.editingEntry);
        }
    }, [admin]);

    return {
        list,
        searchTerm: admin.searchTerm, setSearchTerm: admin.setSearchTerm,
        isModalOpen: admin.isModalOpen, setIsModalOpen: admin.setIsModalOpen,
        editingItem: admin.editingEntry, setEditingItem: admin.setEditingEntry,
        error: admin.error,
        showDeleteConfirm: admin.entryToDelete?.id || null, setShowDeleteConfirm: (id: string | null) => admin.setEntryToDelete(id ? list.find(b => b.id === id) || null : null),
        placedNames,
        filteredList: admin.filteredLibrary.map(m => m.entry),
        handleOpenNew,
        handleOpenEdit: (item: LibraryBackgroundEntry) => admin.handleOpenEdit({ entry: item, source: 'local' }),
        handleDelete: (id: string) => admin.setEntryToDelete(list.find(b => b.id === id) || null),
        confirmDelete: admin.executeDelete,
        handleSave,
        handleBulkSelect,
        toggleActive
    };
};
