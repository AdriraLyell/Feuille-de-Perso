import { useState, useMemo, useCallback } from 'react';
import { CharacterSheetData, LibraryEntry, TraitEffect, DotEntry } from '../types';
import { MergedEntry } from '../utils/libraryMerger';
import { useRules } from '../context/RulesContext';
import { BONUS_MJ_TRAIT_ID } from '../types/rules';
import { useAdminLibrary } from './useAdminLibrary';
import { useNotification } from '../context/NotificationContext';

export const useTraitActions = (
    data: CharacterSheetData,
    onUpdate: (newData: CharacterSheetData) => void,
    defaultType: 'avantage' | 'desavantage'
) => {
    const addLog = useNotification();
    const { rules } = useRules();
    const allFormulas = useMemo(() => rules?.libraries?.formulas || [], [rules]);
    const [tagInput, setTagInput] = useState('');

    const admin = useAdminLibrary<LibraryEntry>({
        data,
        onUpdate,
        addLog,
        collectionKey: 'library',
        officialLibraryKey: 'traits',
        itemName: 'Trait'
    });

    const handleOpenNew = useCallback(() => {
        setTagInput('');
        admin.handleOpenNew({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            type: defaultType,
            cost: '1',
            pointsLabel: '1 point',
            description: '',
            tags: [],
            effects: []
        });
    }, [defaultType, admin]);

    const handleOpenEdit = useCallback((merged: MergedEntry<LibraryEntry> | LibraryEntry) => {
        const entry = 'entry' in merged ? merged.entry : merged;
        if (entry.id === BONUS_MJ_TRAIT_ID) return; // Disallow editing system trait

        const _source = 'source' in merged ? merged.source : 'local';

        setTagInput('');
        admin.setEditingEntry({
            ...entry,
            id: entry.id,
            tags: [...(entry.tags || [])] as string[],
            effects: (entry.effects || []).map(e => ({ ...e })) as TraitEffect[]
        });
        admin.setIsModalOpen(true);
        // Note: formSource logic might need to be preserved if UI depends on it
    }, [admin]);

    const handleDelete = useCallback((id: string, source: string) => {
        if (id === BONUS_MJ_TRAIT_ID) return; // Disallow deleting system trait
        if (source === 'official') return;
        admin.setEntryToDelete(admin.hybridList.find(m => m.entry.id === id)?.entry || null);
    }, [admin]);

    const addTag = useCallback(() => {
        if (!admin.editingEntry || !tagInput.trim()) return;
        const newTag = tagInput.trim();
        if (!(admin.editingEntry.tags || []).includes(newTag)) {
            admin.setEditingEntry({ ...admin.editingEntry, tags: [...(admin.editingEntry.tags || []), newTag] });
        }
        setTagInput('');
    }, [admin, tagInput]);

    const removeTag = useCallback((tagToRemove: string) => {
        if (!admin.editingEntry) return;
        admin.setEditingEntry({ ...admin.editingEntry, tags: (admin.editingEntry.tags || []).filter(t => t !== tagToRemove) });
    }, [admin]);

    const addEffect = useCallback(() => {
        if (!admin.editingEntry) return;
        const newEffect: TraitEffect = { id: Math.random().toString(36).substr(2, 9), type: 'formula', value: 0 };
        admin.setEditingEntry({ ...admin.editingEntry, effects: [...(admin.editingEntry.effects || []), newEffect] });
    }, [admin]);

    const updateEffect = useCallback((id: string, field: keyof TraitEffect, value: string | number | boolean | undefined) => {
        if (!admin.editingEntry) return;

        const newEffects = (admin.editingEntry.effects || []).map(e => e.id === id ? { ...e, [field]: value } : e);

        // Détecter si une des formules force la variante
        const hasForceVariantFormula = newEffects.some(ef => {
            if (!ef.formulaId) return false;
            const formula = allFormulas.find(f => f.id === ef.formulaId);
            return formula?.forceVariant;
        });

        // Si une formule force la variante, on s'assure que le trait est marqué comme variable
        const updatedForm: LibraryEntry = {
            ...admin.editingEntry,
            effects: newEffects,
            isVariable: hasForceVariantFormula ? true : admin.editingEntry.isVariable
        };

        admin.setEditingEntry(updatedForm);
    }, [admin, allFormulas]);

    const removeEffect = useCallback((id: string) => {
        if (!admin.editingEntry) return;
        const newEffects = (admin.editingEntry.effects || []).filter(e => e.id !== id);

        // Recalculer si une des formules restantes force toujours la variante
        const hasForceVariantFormula = newEffects.some(ef => {
            if (!ef.formulaId) return false;
            const formula = allFormulas.find(f => f.id === ef.formulaId);
            return formula?.forceVariant;
        });

        admin.setEditingEntry({
            ...admin.editingEntry,
            effects: newEffects,
            isVariable: hasForceVariantFormula ? true : admin.editingEntry.isVariable
        });
    }, [admin, allFormulas]);

    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];

        // 1. From Character Sheet (Local)
        if (data?.skills) {
            Object.values(data.skills).forEach(skillList => {
                skillList.forEach(s => {
                    if (s.name && s.name.trim() !== '') {
                        skills.push({ id: s.id, name: s.name });
                    }
                });
            });
        }

        // 2. From Official Campaign Libraries
        if (rules?.libraries) {
            if (rules.libraries.skills) {
                rules.libraries.skills.forEach(skill => {
                    if (!skills.some(s => s.id === skill.id)) {
                        skills.push({ id: skill.id, name: skill.name });
                    }
                });
            }
            if (rules.libraries.mysticAbilities) {
                rules.libraries.mysticAbilities.forEach(ma => {
                    if (!skills.some(s => s.id === ma.id)) {
                        skills.push({ id: ma.id, name: ma.name });
                    }
                });
            }
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
            if (key !== 'custom') {
                const rawEntry = (data.counters as any)[key];
                if (!Array.isArray(rawEntry)) {
                    const c = rawEntry as DotEntry;
                    if (c && c.name && c.name.trim() !== '') {
                        counters.push({ id: c.id || key, name: c.name });
                    }
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
        ...admin,
        editForm: admin.editingEntry,
        setEditForm: admin.setEditingEntry,
        tagInput,
        setTagInput,
        showDeleteConfirm: admin.entryToDelete ? admin.entryToDelete.id : null,
        setShowDeleteConfirm: (id: string | null) => admin.setEntryToDelete(id ? admin.hybridList.find(m => m.entry.id === id)?.entry || null : null),
        showOfficialUpdateConfirm: admin.showOfficialUpdateConfirm,
        setShowOfficialUpdateConfirm: admin.setShowOfficialUpdateConfirm,
        updateResult: null, // This was used for official update result, can be re-integrated if needed
        handleOpenNew,
        handleOpenEdit,
        handleDelete,
        confirmDelete: admin.executeDelete,
        handleSave: () => admin.handleSave(admin.editingEntry!),
        executeOfficialUpdate: () => admin.executeOfficialUpdate('./data/traits.json'),
        handleImportTraits: (entries: LibraryEntry[]) => {
            const currentLib = JSON.parse(JSON.stringify((data.library as LibraryEntry[]) || []));
            let addedCount = 0;
            const updatedLib = [...currentLib];
            
            entries.forEach(entry => {
                const index = updatedLib.findIndex(l => l.id === entry.id || (l.name.toLowerCase() === entry.name.toLowerCase() && l.type === entry.type));
                if (index >= 0) {
                    updatedLib[index] = { ...updatedLib[index], ...entry };
                } else {
                    updatedLib.push(entry);
                    addedCount++;
                }
            });

            if (addedCount > 0 || entries.length > 0) {
                updatedLib.sort((a, b) => a.name.localeCompare(b.name));
                onUpdate({ ...data, library: updatedLib });
                addLog(`${addedCount} trait(s) importé(s)/mis à jour.`, 'success', 'settings');
            }
        },
        addTag,
        removeTag,
        addEffect,
        updateEffect,
        removeEffect,
        allSkills,
        allAttributes,
        allCounters,
        allFormulas
    };
};

