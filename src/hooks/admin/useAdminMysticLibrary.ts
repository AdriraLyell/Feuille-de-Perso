import { useCallback } from 'react';
import { RulesData } from '../../types/rules';
import { LibrarySkillEntry } from '../../types/system';
import { useAdminLibrary } from '../useAdminLibrary';
import { useNotification } from '../../context/NotificationContext';

export const useAdminMysticLibrary = (
    rules: RulesData,
    onUpdate: (newRules: RulesData) => void,
    globalUsage: Record<string, number> = {}
) => {
    const addLog = useNotification();

    const admin = useAdminLibrary<LibrarySkillEntry, RulesData>({
        data: rules,
        onUpdate,
        addLog,
        collectionKey: 'libraries.mysticAbilities',
        itemName: 'Habilité mystique',
        disableMerge: true
    });

    const list = admin.hybridList.map(m => m.entry);

    const handleOpenNew = useCallback(() => {
        admin.handleOpenNew({
            id: crypto.randomUUID(),
            name: '',
            description: '',
            isActive: true,
            isGlobal: true
        });
    }, [admin]);

    const handleSave = useCallback(() => {
        if (!admin.editingEntry) return;
        const itemName = admin.editingEntry.name.trim();

        if (!itemName) {
            admin.setError("Le nom est requis.");
            return;
        }

        const duplicate = list.find(b => b.id !== admin.editingEntry!.id && b.name.trim().toLowerCase() === itemName.toLowerCase());
        if (duplicate) {
            admin.setError("Une habilité portant ce nom existe déjà.");
            return;
        }

        const updatedAbility = {
            ...admin.editingEntry,
            name: itemName,
            defaultCategory: admin.editingEntry.defaultCategory || undefined
        };

        const newList = list.some(b => b.id === admin.editingEntry!.id)
            ? list.map(b => b.id === admin.editingEntry!.id ? updatedAbility : b)
            : [...list, updatedAbility];

        newList.sort((a, b) => a.name.localeCompare(b.name));

        // SYNC LOGIC: Auto-Manage associated Trait
        const currentTraits = rules.libraries.traits || [];
        const targetTraitIndex = currentTraits.findIndex(t =>
            t.mysticAbilityId === admin.editingEntry!.id ||
            (!t.mysticAbilityId && t.name.toLowerCase() === itemName.toLowerCase())
        );

        const newTraits = [...currentTraits];
        const traitBaseData = {
            name: itemName,
            type: 'avantage' as const,
            isVariableCost: true,
            cost: "1",
            pointsLabel: "1-5",
            description: admin.editingEntry.description || "Habilité mystique",
            mysticAbilityId: admin.editingEntry.id,
            isActive: admin.editingEntry.isActive,
            isGlobal: admin.editingEntry.isGlobal,
            tags: ['Mystique']
        };

        if (targetTraitIndex >= 0) {
            newTraits[targetTraitIndex] = {
                ...newTraits[targetTraitIndex],
                ...traitBaseData
            };
        } else {
            newTraits.push({
                id: crypto.randomUUID(),
                ...traitBaseData
            });
        }

        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                mysticAbilities: newList,
                traits: newTraits
            }
        });

        admin.setIsModalOpen(false);
        admin.setEditingEntry(null);
    }, [admin, list, onUpdate, rules]);

    const handleBulkSelect = useCallback((active: boolean) => {
        const visibleIds = new Set(admin.filteredLibrary.map(item => item.entry.id));
        const newList = list.map(item =>
            visibleIds.has(item.id) ? { ...item, isActive: active } : item
        );
        onUpdate({ ...rules, libraries: { ...rules.libraries, mysticAbilities: newList } });
    }, [admin.filteredLibrary, list, onUpdate, rules]);

    const toggleActive = useCallback((id: string, current: boolean) => {
        const newList = list.map(b => b.id === id ? { ...b, isActive: !current } : b);
        onUpdate({ ...rules, libraries: { ...rules.libraries, mysticAbilities: newList } });
    }, [list, onUpdate, rules]);

    return {
        list,
        searchTerm: admin.searchTerm, setSearchTerm: admin.setSearchTerm,
        isModalOpen: admin.isModalOpen, setIsModalOpen: admin.setIsModalOpen,
        editingItem: admin.editingEntry, setEditingItem: admin.setEditingEntry,
        error: admin.error,
        showDeleteConfirm: admin.entryToDelete?.id || null, setShowDeleteConfirm: (id: string | null) => admin.setEntryToDelete(id ? list.find(b => b.id === id) || null : null),
        filteredList: admin.filteredLibrary.map(m => m.entry),
        handleOpenNew,
        handleOpenEdit: (item: LibrarySkillEntry) => admin.handleOpenEdit({ entry: item, source: 'local' }),
        handleDelete: (id: string) => admin.setEntryToDelete(list.find(b => b.id === id) || null),
        confirmDelete: admin.executeDelete,
        handleSave,
        handleBulkSelect,
        toggleActive
    };
};
