import { useState, useMemo, useCallback } from 'react';
import { CharacterSheetData, LibraryEntry, TraitEffect } from '../types';
import { MergedEntry } from '../utils/libraryMerger';
import { useRules } from '../context/RulesContext';

export const useTraitActions = (
    data: CharacterSheetData,
    onUpdate: (newData: CharacterSheetData) => void,
    defaultType: 'avantage' | 'desavantage'
) => {
    const { rules, updateRules } = useRules();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<LibraryEntry | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [showOfficialUpdateConfirm, setShowOfficialUpdateConfirm] = useState(false);
    const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleOpenNew = useCallback(() => {
        setError(null);
        setTagInput('');
        setEditForm({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            type: defaultType,
            cost: '1',
            pointsLabel: '1 point',
            description: '',
            tags: [],
            effects: []
        });
        setIsModalOpen(true);
    }, [defaultType]);

    const handleOpenEdit = useCallback((merged: MergedEntry<LibraryEntry> | LibraryEntry) => {
        const entry = 'entry' in merged ? merged.entry : merged;
        const source = 'source' in merged ? merged.source : 'local';

        setError(null);
        setTagInput('');
        setEditForm({
            ...entry,
            id: entry.id,
            tags: [...(entry.tags || [])],
            effects: (entry.effects || []).map(e => ({ ...e }))
        });
        setIsModalOpen(true);
    }, []);

    const handleDelete = useCallback((id: string, source: string) => {
        if (source === 'official') return;
        setShowDeleteConfirm(id);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!showDeleteConfirm) return;
        const local = (data && Array.isArray(data.library)) ? data.library : [];
        onUpdate({ ...data, library: local.filter(l => l.id !== showDeleteConfirm) });
        setShowDeleteConfirm(null);
    }, [data, onUpdate, showDeleteConfirm]);

    const handleSave = useCallback(() => {
        if (!editForm) return;
        if (!editForm.name.trim()) { setError("Le nom du trait ne peut pas être vide."); return; }

        const local = (data && Array.isArray(data.library)) ? data.library : [];
        const duplicate = local.find(l => l.id !== editForm.id && l.name.trim().toLowerCase() === editForm.name.trim().toLowerCase());

        if (duplicate) { setError("Un trait personnel portant ce nom existe déjà."); return; }

        const formToSave = {
            ...editForm,
            variants: editForm.variants ? editForm.variants.map(v => v.trim()).filter(v => v !== '') : []
        };

        const existsLocally = local.some(l => l.id === formToSave.id);
        const newLibrary = existsLocally
            ? local.map(l => l.id === formToSave.id ? formToSave : l)
            : [formToSave, ...local];

        onUpdate({ ...data, library: newLibrary });
        setIsModalOpen(false);
        setEditForm(null);
    }, [data, editForm, onUpdate]);

    const executeOfficialUpdate = async () => {
        try {
            const res = await fetch('./data/traits.json?t=' + Date.now());
            if (!res.ok) throw new Error("Fichier introuvable");

            const json = await res.json();
            const newTraits = json.data as LibraryEntry[];

            if (json.meta && json.meta.type !== 'traits') throw new Error("Format invalide");

            const updatedRules = {
                ...rules!,
                libraries: {
                    ...rules!.libraries,
                    traits: newTraits
                }
            };
            updateRules(updatedRules);
            setUpdateResult({ success: true, message: `Bibliothèque officielle mise à jour (${newTraits.length} traits).` });
        } catch (e) {
            setUpdateResult({ success: false, message: "Échec de la mise à jour officielle : " + (e as Error).message });
        } finally {
            setShowOfficialUpdateConfirm(false);
        }
    };

    const handleImportTraits = useCallback((importedEntries: LibraryEntry[]) => {
        const local = (data && Array.isArray(data.library)) ? data.library : [];
        const newLibrary = [...local];

        importedEntries.forEach(entry => {
            const index = newLibrary.findIndex(l => l.id === entry.id);
            if (index >= 0) {
                newLibrary[index] = entry;
            } else {
                newLibrary.unshift(entry);
            }
        });

        onUpdate({ ...data, library: newLibrary });
    }, [data, onUpdate]);

    const addTag = useCallback(() => {
        if (!editForm || !tagInput.trim()) return;
        const newTag = tagInput.trim();
        if (!(editForm.tags || []).includes(newTag)) {
            setEditForm({ ...editForm, tags: [...(editForm.tags || []), newTag] });
        }
        setTagInput('');
    }, [editForm, tagInput]);

    const removeTag = useCallback((tagToRemove: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, tags: (editForm.tags || []).filter(t => t !== tagToRemove) });
    }, [editForm]);

    const addEffect = useCallback(() => {
        if (!editForm) return;
        const newEffect: TraitEffect = { id: Math.random().toString(36).substr(2, 9), type: 'formula', value: 0 };
        setEditForm({ ...editForm, effects: [...(editForm.effects || []), newEffect] });
    }, [editForm]);

    const updateEffect = useCallback((id: string, field: keyof TraitEffect, value: any) => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            effects: (editForm.effects || []).map(e => e.id === id ? { ...e, [field]: value } : e)
        });
    }, [editForm]);

    const removeEffect = useCallback((id: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, effects: (editForm.effects || []).filter(e => e.id !== id) });
    }, [editForm]);

    const allSkills = useMemo(() => {
        if (!data || !data.skills) return [];
        const skills: { id: string, name: string }[] = [];
        Object.values(data.skills).forEach(skillList => {
            skillList.forEach(s => {
                if (s.name && s.name.trim() !== '') {
                    skills.push({ id: s.id, name: s.name });
                }
            });
        });
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.skills]);

    const allAttributes = useMemo(() => {
        if (!data || !data.attributes) return [];
        const attrs: { id: string, name: string }[] = [];
        if (data.attributes) {
            Object.keys(data.attributes).forEach(key => {
                data.attributes[key].forEach(a => {
                    if (a.name && a.name.trim() !== '') {
                        attrs.push({ id: a.id, name: a.name });
                    }
                });
            });
        }
        return attrs.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.attributes]);

    const allCounters = useMemo(() => {
        if (!data || !data.counters) return [];
        const counters: { id: string, name: string }[] = [];

        // System counters
        Object.keys(data.counters).forEach(key => {
            if (key !== 'custom' && !Array.isArray(data.counters[key])) {
                const c = data.counters[key] as import('../types').DotEntry;
                if (c && c.name && c.name.trim() !== '') {
                    counters.push({ id: c.id || key, name: c.name });
                }
            }
        });

        // Custom counters
        if (data.counters.custom && Array.isArray(data.counters.custom)) {
            data.counters.custom.forEach(c => {
                if (c && c.name && c.name.trim() !== '') {
                    counters.push({ id: c.id, name: c.name });
                }
            });
        }

        // Also look at counterLibrary
        if (data.counterLibrary && Array.isArray(data.counterLibrary)) {
            data.counterLibrary.forEach(c => {
                if (c && c.name && c.name.trim() !== '' && !counters.some(ex => ex.name === c.name)) {
                    counters.push({ id: c.id, name: c.name });
                }
            });
        }

        return counters.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.counters, data.counterLibrary]);

    return {
        isModalOpen,
        setIsModalOpen,
        editForm,
        setEditForm,
        tagInput,
        setTagInput,
        error,
        showDeleteConfirm,
        setShowDeleteConfirm,
        showOfficialUpdateConfirm,
        setShowOfficialUpdateConfirm,
        updateResult,
        setUpdateResult,
        handleOpenNew,
        handleOpenEdit,
        handleDelete,
        confirmDelete,
        handleSave,
        executeOfficialUpdate,
        handleImportTraits,
        addTag,
        removeTag,
        addEffect,
        updateEffect,
        removeEffect,
        allSkills,
        allAttributes,
        allCounters
    };
};
