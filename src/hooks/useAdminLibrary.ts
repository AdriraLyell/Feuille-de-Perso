import { useState, useMemo, useCallback, useContext } from 'react';
import { RulesData } from '../types/rules';
import { RulesContext } from '../context/RulesContext';
import { mergeLibraries, MergedEntry } from '../utils/libraryMerger';
import { smartIncludes } from '../utils/stringUtils';

interface UseAdminLibraryProps<T extends { id: string; name: string }, TData = any> {
    data: TData;
    onUpdate: (newData: TData) => void;
    addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void;
    collectionKey: string; // Supported: "key" or "parent.child"
    officialLibraryKey?: string;
    itemName: string;
    onImport?: (currentLib: T[]) => { addedCount: number; updatedLib: T[] };
    disableMerge?: boolean;
}

export const useAdminLibrary = <T extends { id: string; name: string }, TData = any>({
    data,
    onUpdate,
    addLog,
    collectionKey,
    officialLibraryKey,
    itemName,
    onImport,
    disableMerge = false
}: UseAdminLibraryProps<T, TData>) => {
    const context = useContext(RulesContext);
    const rules = context?.rules;
    const updateRules = context?.updateRules;

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<T | null>(null);
    const [showOfficialUpdateConfirm, setShowOfficialUpdateConfirm] = useState(false);

    // Helper to get/set nested data
    const getCollection = useCallback(() => {
        const keys = collectionKey.split('.');
        let current: any = data;
        for (const key of keys) {
            if (!current) return [];
            current = current[key];
        }
        return (current as T[]) || [];
    }, [data, collectionKey]);

    const setCollection = useCallback((newList: T[]) => {
        const keys = collectionKey.split('.');
        const newData = { ...data } as any;
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = newList;
        onUpdate(newData);
    }, [data, collectionKey, onUpdate]);

    // MERGE: Compute Hybrid Library
    const hybridList = useMemo(() => {
        const local = getCollection();
        if (disableMerge || !officialLibraryKey) {
            return local.map(entry => ({ entry, source: 'local' as const, originalId: entry.id }));
        }
        // If RulesProvider is missing (Admin panel), use the 'data' passed as prop if it appears to be RulesData
        const referenceRules = rules || (data as any);
        const official = (referenceRules?.libraries as any)?.[officialLibraryKey] || [];
        return mergeLibraries(local, official);
    }, [getCollection, disableMerge, officialLibraryKey, rules, data]);

    const filteredLibrary = useMemo(() => {
        return hybridList.filter(m => {
            const entry = m.entry as any;
            const matchesSearch = smartIncludes(entry.name, searchTerm) ||
                (entry.description && smartIncludes(entry.description, searchTerm));
            return matchesSearch;
        }).sort((a, b) => a.entry.name.localeCompare(b.entry.name));
    }, [hybridList, searchTerm]);

    const handleOpenNew = useCallback((template: T) => {
        setError(null);
        setEditingEntry(template);
        setIsModalOpen(true);
    }, []);

    const handleOpenEdit = useCallback((merged: { entry: T; source?: any; originalId?: string }) => {
        setError(null);
        setEditingEntry({ ...merged.entry });
        setIsModalOpen(true);
    }, []);

    const handleSave = useCallback((entryToSave: T) => {
        if (!entryToSave.name.trim()) {
            setError(`Le nom de ${itemName.toLowerCase()} est requis.`);
            return;
        }

        const duplicate = hybridList.find(m =>
            m.source === 'local' &&
            m.entry.id !== entryToSave.id &&
            m.entry.name.trim().toLowerCase() === entryToSave.name.trim().toLowerCase()
        );

        if (duplicate) {
            setError(`Un(e) ${itemName.toLowerCase()} local(e) portant ce nom existe déjà.`);
            return;
        }

        const localList = getCollection();
        const exists = localList.some(e => e.id === entryToSave.id);

        let newLibrary;
        if (exists) {
            newLibrary = localList.map(e => e.id === entryToSave.id ? entryToSave : e);
        } else {
            newLibrary = [...localList, entryToSave];
        }

        setCollection(newLibrary);
        addLog(`${itemName} "${entryToSave.name}" enregistré(e).`, 'success', 'settings');
        setIsModalOpen(false);
        setEditingEntry(null);
    }, [getCollection, setCollection, hybridList, itemName, addLog]);

    const executeOfficialUpdate = useCallback(async (endpoint: string) => {
        try {
            const res = await fetch(`${endpoint}?t=${Date.now()}`);
            if (!res.ok) throw new Error("Fichier introuvable");

            const json = await res.json();
            const newData = json.data as T[];

            if (json.meta && json.meta.type !== officialLibraryKey) throw new Error("Format invalide");

            const currentRules = rules || (data as any);
            const updatedRules = {
                ...currentRules!,
                libraries: {
                    ...(currentRules!.libraries as any),
                    [officialLibraryKey!]: newData
                }
            };
            
            if (updateRules) {
                updateRules(updatedRules);
            } else {
                onUpdate(updatedRules);
            }
            
            addLog(`Bibliothèque officielle mise à jour (${newData.length} ${itemName.toLowerCase()}s).`, 'success', 'settings');
            setShowOfficialUpdateConfirm(false);
        } catch (e) {
            addLog("Échec de la mise à jour officielle : " + (e as Error).message, 'danger', 'settings');
        }
    }, [rules, updateRules, onUpdate, addLog, officialLibraryKey, itemName, data]);

    const executeImportFromSheet = useCallback(() => {
        if (!onImport) return;
        
        const currentLib = JSON.parse(JSON.stringify(getCollection()));
        const { addedCount, updatedLib } = onImport(currentLib);

        if (addedCount > 0) {
            updatedLib.sort((a, b) => a.name.localeCompare(b.name));
            setCollection(updatedLib);
            addLog(`${addedCount} ${itemName.toLowerCase()}(s) importé(s) depuis la fiche.`, 'success', 'settings');
        } else {
            addLog(`Toutes les ${itemName.toLowerCase()}s de la fiche sont déjà dans la bibliothèque.`, 'info', 'settings');
        }
        setShowImportConfirm(false);
    }, [getCollection, setCollection, addLog, onImport, itemName]);

    const handleDeleteRequest = useCallback((merged: MergedEntry<T>) => {
        if (merged.source === 'official') {
            addLog(`Impossible de supprimer un(e) ${itemName.toLowerCase()} officiel(le).`, 'info', 'settings');
            return;
        }
        setEntryToDelete(merged.entry);
    }, [addLog, itemName]);

    const executeDelete = useCallback(() => {
        if (!entryToDelete) return;
        const localList = getCollection();
        setCollection(localList.filter(e => e.id !== entryToDelete.id));
        addLog(`${itemName} "${entryToDelete.name}" supprimé(e).`, 'info', 'settings');
        setEntryToDelete(null);
    }, [entryToDelete, getCollection, setCollection, addLog, itemName]);

    return {
        searchTerm, setSearchTerm,
        isModalOpen, setIsModalOpen,
        editingEntry, setEditingEntry,
        error, setError,
        showImportConfirm, setShowImportConfirm,
        entryToDelete, setEntryToDelete,
        showOfficialUpdateConfirm, setShowOfficialUpdateConfirm,
        hybridList,
        filteredLibrary,
        handleOpenNew,
        handleOpenEdit,
        handleSave,
        executeOfficialUpdate,
        executeImportFromSheet,
        handleDeleteRequest,
        executeDelete
    };
};
