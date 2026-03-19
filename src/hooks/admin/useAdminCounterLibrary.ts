import { useMemo, useCallback } from 'react';
import { RulesData } from '../../types/rules';
import { LibraryCounterEntry } from '../../types/system';
import { useAdminLibrary } from '../useAdminLibrary';
import { useNotification } from '../../context/NotificationContext';

const VOLONTE_UUID = 'c0000000-0000-0000-0000-000000000001';
const CONFIANCE_UUID = 'c0000000-0000-0000-0000-000000000002';

export const useAdminCounterLibrary = (
    rules: RulesData,
    onUpdate: (newRules: RulesData) => void,
    globalUsage: Record<string, number> = {}
) => {
    const addLog = useNotification();

    const admin = useAdminLibrary<LibraryCounterEntry, RulesData>({
        data: rules,
        onUpdate,
        addLog,
        collectionKey: 'libraries.counters',
        itemName: 'Compteur',
        disableMerge: true
    });

    const list = admin.hybridList.map(m => m.entry);

    const placedNames = useMemo(() => {
        const names = new Set<string>();
        const counterCat = rules.definitions.skillCategories?.find(c => c.behavior === 'Compteur')?.id || 'Col_Comp_9';
        const placed = rules.definitions.skills?.[counterCat] || [];
        placed.forEach(name => {
            if (name.trim()) names.add(name.trim().toLowerCase());
        });
        return names;
    }, [rules.definitions]);

    const filteredList = useMemo(() => {
        return admin.filteredLibrary.map(m => m.entry);
    }, [admin.filteredLibrary]);

    const handleOpenNew = useCallback(() => {
        admin.handleOpenNew({
            id: crypto.randomUUID(),
            name: '',
            description: '',
            maxValue: 10,
            defaultValue: 0,
            xpCost: 0,
            isGlobal: false
        });
    }, [admin]);

    const handleSave = useCallback(() => {
        if (!admin.editingEntry) return;
        const entry = admin.editingEntry;

        const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const normName = normalize(entry.name);

        let finalId = entry.id;
        if (normName === 'volonte') finalId = VOLONTE_UUID;
        else if (normName === 'confiance') finalId = CONFIANCE_UUID;

        const safeItem: LibraryCounterEntry = {
            ...entry,
            id: finalId,
            maxValue: Number(entry.maxValue) || 10,
            defaultValue: Number(entry.defaultValue) || 0,
            xpCost: Number(entry.xpCost) || 0,
            appearance: (entry.appearance === 'squares_only' ? 'squares_only' : null) as 'squares_only' | null
        };

        const newList = list.some(c => c.id === safeItem.id)
            ? list.map(c => c.id === safeItem.id ? safeItem : c)
            : [...list, safeItem];

        newList.sort((a, b) => a.name.localeCompare(b.name));

        // Update definitions as well
        const newDefinitionsCounters = { ...(rules.definitions.counters || {}) };
        const key = safeItem.id === VOLONTE_UUID ? 'volonte' : (safeItem.id === CONFIANCE_UUID ? 'confiance' : (safeItem.id || safeItem.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')));

        newDefinitionsCounters[key] = {
            id: safeItem.id,
            name: safeItem.name,
            description: safeItem.description || newDefinitionsCounters[key]?.description || '',
            max: safeItem.formulaId ? 0 : (safeItem.maxValue ?? 10),
            value: safeItem.defaultValue ?? newDefinitionsCounters[key]?.value,
            defaultValue: safeItem.defaultValue ?? newDefinitionsCounters[key]?.defaultValue,
            xpCost: safeItem.xpCost ?? newDefinitionsCounters[key]?.xpCost ?? 0,
            appearance: safeItem.appearance === 'squares_only' ? 'squares_only' : undefined,
            formulaId: safeItem.formulaId
        };

        onUpdate({
            ...rules,
            definitions: { ...rules.definitions, counters: newDefinitionsCounters },
            libraries: { ...rules.libraries, counters: newList }
        });

        admin.setIsModalOpen(false);
        admin.setEditingEntry(null);
    }, [admin, list, onUpdate, rules]);

    const confirmDelete = useCallback(() => {
        const idToDelete = admin.entryToDelete?.id;
        if (!idToDelete) return;

        const counterToDelete = list.find(c => c.id === idToDelete);
        const newDefinitionsCounters = { ...(rules.definitions.counters || {}) };

        if (counterToDelete) {
            const key = counterToDelete.id === VOLONTE_UUID ? 'volonte' : (counterToDelete.id === CONFIANCE_UUID ? 'confiance' : counterToDelete.id || counterToDelete.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''));
            delete newDefinitionsCounters[key];
        }

        onUpdate({
            ...rules,
            definitions: { ...rules.definitions, counters: newDefinitionsCounters },
            libraries: { ...rules.libraries, counters: list.filter(c => c.id !== idToDelete) }
        });
        admin.setEntryToDelete(null);
    }, [admin, list, onUpdate, rules]);

    const handleBulkSelect = useCallback((active: boolean) => {
        const visibleIds = new Set(filteredList.map(item => item.id));
        const newList = list.map(item => {
            if (!visibleIds.has(item.id)) return item;
            if (!active) {
                const isPlaced = placedNames.has(item.name.trim().toLowerCase());
                const isGloballyUsed = !!globalUsage[item.id];
                if (isPlaced || isGloballyUsed) return item;
            }
            return { ...item, isActive: active };
        });

        onUpdate({ ...rules, libraries: { ...rules.libraries, counters: newList } });
    }, [filteredList, list, onUpdate, rules, placedNames, globalUsage]);

    const toggleActive = useCallback((id: string, current: boolean) => {
        const isPlaced = list.find(c => c.id === id)?.name && placedNames.has(list.find(c => c.id === id)!.name.trim().toLowerCase());
        const isGloballyUsed = !!globalUsage[id];
        if (current && (isPlaced || isGloballyUsed)) return;

        const newList = list.map(c => c.id === id ? { ...c, isActive: !current } : c);
        onUpdate({ ...rules, libraries: { ...rules.libraries, counters: newList } });
    }, [list, onUpdate, rules, placedNames, globalUsage]);

    return {
        list,
        searchTerm: admin.searchTerm, setSearchTerm: admin.setSearchTerm,
        isModalOpen: admin.isModalOpen, setIsModalOpen: admin.setIsModalOpen,
        editingItem: admin.editingEntry, setEditingItem: admin.setEditingEntry,
        error: admin.error,
        showDeleteConfirm: admin.entryToDelete?.id || null, setShowDeleteConfirm: (id: string | null) => admin.setEntryToDelete(id ? list.find(c => c.id === id) || null : null),
        placedNames,
        filteredList,
        handleOpenNew,
        handleOpenEdit: (item: LibraryCounterEntry) => admin.handleOpenEdit({ entry: item, source: 'local' }),
        handleDelete: (id: string) => admin.setEntryToDelete(list.find(c => c.id === id) || null),
        confirmDelete,
        handleSave,
        handleBulkSelect,
        toggleActive
    };
};
