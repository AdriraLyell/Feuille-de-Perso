import { useState, useMemo, useCallback } from 'react';
import { CharacterSheetData, LibrarySpecializationEntry } from '../../../types';
import { useNotification } from '../../../context/NotificationContext';
import { useRules } from '../../../context/RulesContext';
import { mergeLibraries, MergedEntry } from '../../../utils/libraryMerger';
import { smartIncludes } from '../../../utils/stringUtils';

interface UseSpecializationLibraryProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
}

export const useSpecializationLibrary = ({ data, onUpdate }: UseSpecializationLibraryProps) => {
    const addLog = useNotification();
    const { rules, updateRules } = useRules();

    const [searchTerm, setSearchTerm] = useState('');
    const [hideKnown, setHideKnown] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<LibrarySpecializationEntry | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<LibrarySpecializationEntry | null>(null);
    const [skillSearch, setSkillSearch] = useState('');
    const [showOfficialUpdateConfirm, setShowOfficialUpdateConfirm] = useState(false);

    // MERGE: Compute Hybrid Specialization Library
    const hybridSpecializations = useMemo(() => {
        const local = data.specializationLibrary || [];
        const official = rules?.libraries?.specializations || [];
        return mergeLibraries(local, official);
    }, [data.specializationLibrary, rules]);

    // Liste plate de toutes les compétences pour le mapping
    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];

        // 1. From Character Sheet (Local)
        if (data.skills) {
            Object.values(data.skills).forEach(category => {
                category.forEach(skill => {
                    if (skill.name && skill.name.trim() !== '') {
                        skills.push({ id: skill.id, name: skill.name });
                    }
                });
            });
        }

        // 2. From Official Campaign Libraries (for names of skills not yet on sheet)
        if (rules?.libraries) {
            // Regular Skills
            if (rules.libraries.skills) {
                rules.libraries.skills.forEach(skill => {
                    if (!skills.some(s => s.id === skill.id)) {
                        skills.push({ id: skill.id, name: skill.name });
                    }
                });
            }

            // Mystic Abilities
            if (rules.libraries.mysticAbilities) {
                rules.libraries.mysticAbilities.forEach(ma => {
                    if (!skills.some(s => s.id === ma.id)) {
                        skills.push({ id: ma.id, name: ma.name });
                    }
                });
            }

            // Backgrounds
            if (rules.libraries.backgrounds) {
                rules.libraries.backgrounds.forEach(bg => {
                    if (!skills.some(s => s.id === bg.id)) {
                        skills.push({ id: bg.id, name: bg.name });
                    }
                });
            }
        }

        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.skills, rules?.libraries]);

    // Déterminer quelles spécialisations sont déjà utilisées sur la fiche
    const usedSpecializations = useMemo(() => {
        const names = new Set<string>();
        Object.values(data.specializations || {}).forEach(spes => {
            spes.forEach(s => names.add(s.trim().toLowerCase()));
        });
        Object.values(data.imposedSpecializations || {}).forEach(spes => {
            spes.forEach(s => names.add(s.name.trim().toLowerCase()));
        });
        return names;
    }, [data.specializations, data.imposedSpecializations]);

    // Filtrer et trier la bibliothèque
    const filteredLibrary = useMemo(() => {
        return hybridSpecializations.filter(m => {
            const matchesSearch = smartIncludes(m.entry.name, searchTerm) ||
                (m.entry.description && smartIncludes(m.entry.description, searchTerm));

            const isUsed = usedSpecializations.has(m.entry.name.trim().toLowerCase());
            const matchesFilter = hideKnown ? !isUsed : true;

            return matchesSearch && matchesFilter;
        }).sort((a, b) => a.entry.name.localeCompare(b.entry.name));
    }, [hybridSpecializations, searchTerm, hideKnown, usedSpecializations]);

    const handleOpenNew = useCallback(() => {
        setError(null);
        setEditingEntry({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            skillIds: [],
            defaultMinLevel: 1,
            description: '',
            isImposed: false
        });
        setSkillSearch('');
        setIsModalOpen(true);
    }, []);

    const handleOpenEdit = useCallback((merged: MergedEntry<LibrarySpecializationEntry>) => {
        setError(null);
        setSkillSearch('');
        setEditingEntry({ ...merged.entry });
        setIsModalOpen(true);
    }, []);

    const handleSave = useCallback(() => {
        if (!editingEntry) return;
        if (!editingEntry.name.trim()) {
            setError("Le nom est requis.");
            return;
        }

        const duplicate = hybridSpecializations.find(m =>
            m.source === 'local' &&
            m.entry.id !== editingEntry.id &&
            m.entry.name.trim().toLowerCase() === editingEntry.name.trim().toLowerCase()
        );

        if (duplicate) {
            setError("Une spécialisation locale portant ce nom existe déjà.");
            return;
        }

        let newLibrary;
        const localList = data.specializationLibrary || [];
        const exists = localList.some(e => e.id === editingEntry.id);

        if (exists) {
            newLibrary = localList.map(e => e.id === editingEntry.id ? editingEntry : e);
        } else {
            newLibrary = [...localList, editingEntry];
        }

        onUpdate({ ...data, specializationLibrary: newLibrary });
        addLog(`Spécialisation "${editingEntry.name}" enregistrée.`, 'success', 'settings');
        setIsModalOpen(false);
        setEditingEntry(null);
    }, [editingEntry, hybridSpecializations, data, onUpdate, addLog]);

    const executeOfficialUpdate = useCallback(async () => {
        try {
            const res = await fetch('./data/specializations.json?t=' + Date.now());
            if (!res.ok) throw new Error("Fichier introuvable");

            const json = await res.json();
            const newSpecs = json.data as LibrarySpecializationEntry[];

            if (json.meta && json.meta.type !== 'specializations') throw new Error("Format invalide");

            const updatedRules = {
                ...rules!,
                libraries: {
                    ...rules!.libraries,
                    specializations: newSpecs
                }
            };
            updateRules(updatedRules);
            addLog(`Bibliothèque officielle mise à jour (${newSpecs.length} spécialisations).`, 'success', 'settings');
            setShowOfficialUpdateConfirm(false);
        } catch (e) {
            addLog("Échec de la mise à jour officielle : " + (e as Error).message, 'danger', 'settings');
        }
    }, [rules, updateRules, addLog]);

    const executeImportFromSheet = useCallback(() => {
        const currentLib = JSON.parse(JSON.stringify(data.specializationLibrary || []));
        const existingNames = new Set(currentLib.map((e: any) => e.name.trim().toLowerCase()));
        let addedCount = 0;

        Object.entries(data.specializations || {}).forEach(([skillId, spes]) => {
            spes.forEach(name => {
                const norm = name.trim();
                if (norm && !existingNames.has(norm.toLowerCase())) {
                    currentLib.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: norm,
                        skillIds: [skillId],
                        defaultMinLevel: 1,
                        description: "",
                        isImposed: false
                    });
                    existingNames.add(norm.toLowerCase());
                    addedCount++;
                }
            });
        });

        Object.entries(data.imposedSpecializations || {}).forEach(([skillId, spes]) => {
            spes.forEach(s => {
                const norm = s.name.trim();
                if (norm && !existingNames.has(norm.toLowerCase())) {
                    currentLib.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: norm,
                        skillIds: [skillId],
                        defaultMinLevel: s.minLevel,
                        description: "",
                        isImposed: true
                    });
                    existingNames.add(norm.toLowerCase());
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            currentLib.sort((a: any, b: any) => a.name.localeCompare(b.name));
            onUpdate({ ...data, specializationLibrary: currentLib });
            addLog(`${addedCount} spécialisation(s) importée(s) depuis la fiche.`, 'success', 'settings');
        } else {
            addLog("Toutes les spécialisations de la fiche sont déjà dans la bibliothèque.", 'info', 'settings');
        }
        setShowImportConfirm(false);
    }, [data, onUpdate, addLog]);

    const handleDeleteRequest = useCallback((merged: MergedEntry<LibrarySpecializationEntry>) => {
        if (merged.source === 'official') {
            addLog("Impossible de supprimer une spécialisation officielle.", 'info', 'settings');
            return;
        }
        setEntryToDelete(merged.entry);
    }, [addLog]);

    const executeDelete = useCallback(() => {
        if (!entryToDelete) return;
        const localList = data.specializationLibrary || [];
        onUpdate({
            ...data,
            specializationLibrary: localList.filter(e => e.id !== entryToDelete.id)
        });
        addLog(`Spécialisation "${entryToDelete.name}" supprimée.`, 'info', 'settings');
        setEntryToDelete(null);
    }, [entryToDelete, data, onUpdate, addLog]);

    return {
        searchTerm, setSearchTerm,
        hideKnown, setHideKnown,
        isModalOpen, setIsModalOpen,
        editingEntry, setEditingEntry,
        error,
        showImportConfirm, setShowImportConfirm,
        entryToDelete, setEntryToDelete,
        skillSearch, setSkillSearch,
        showOfficialUpdateConfirm, setShowOfficialUpdateConfirm,
        hybridSpecializations,
        allSkills,
        usedSpecializations,
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
