import { useState, useMemo } from 'react';
import { LibrarySkillEntry, CharacterSheetData } from '../../types';
import { RulesData } from '../../types/rules';
import { mergeLibraries, MergedEntry } from '../../utils/libraryMerger';
import { smartIncludes } from '../../utils/stringUtils';

export const useSkillLibrary = (
    data: CharacterSheetData,
    rules: RulesData | null,
    onUpdate: (newData: CharacterSheetData) => void,
    addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void
) => {
    const [skillSearch, setSkillSearch] = useState('');
    const [hideKnownSkills, setHideKnownSkills] = useState(true);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState<LibrarySkillEntry | null>(null);
    const [skillFormSource, setSkillFormSource] = useState<'local' | 'official'>('local');
    const [skillError, setSkillError] = useState<string | null>(null);
    const [showRenameConfirm, setShowRenameConfirm] = useState<{ oldName: string, newSkill: LibrarySkillEntry } | null>(null);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [skillToDelete, setSkillToDelete] = useState<LibrarySkillEntry | null>(null);

    const hybridSkills = useMemo(() => {
        const local = data.skillLibrary || [];
        const official = rules?.libraries?.skills || [];
        return mergeLibraries(local, official);
    }, [data.skillLibrary, rules]);

    const usedSkillNames = useMemo(() => {
        const names = new Set<string>();
        if (data.skills) {
            Object.keys(data.skills).forEach(key => {
                const list = data.skills[key] || [];
                list.forEach((s: import('../../types').DotEntry) => {
                    if (s.name && s.name.trim() !== '') {
                        names.add(s.name.trim().toLowerCase());
                    }
                });
            });
        }
        return names;
    }, [data.skills]);

    const filteredSkills = useMemo(() => {
        return hybridSkills.filter(m => {
            const matchesSearch = smartIncludes(m.entry.name, skillSearch) ||
                smartIncludes(m.entry.description || '', skillSearch);
            const isKnown = usedSkillNames.has(m.entry.name.trim().toLowerCase());
            const matchesFilter = hideKnownSkills ? !isKnown : true;
            return matchesSearch && matchesFilter;
        }).sort((a, b) => a.entry.name.localeCompare(b.entry.name));
    }, [hybridSkills, skillSearch, hideKnownSkills, usedSkillNames]);

    const handleOpenNewSkill = () => {
        setSkillError(null);
        setEditingSkill({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            description: ''
        });
        setSkillFormSource('local');
        setIsSkillModalOpen(true);
    };

    const handleOpenEditSkill = (merged: MergedEntry<LibrarySkillEntry>) => {
        setSkillError(null);
        setEditingSkill({ ...merged.entry });
        setSkillFormSource(merged.source === 'official' ? 'official' : 'local');
        setIsSkillModalOpen(true);
    };

    const finalizeSaveSkill = (skillToSave: LibrarySkillEntry, renameOnSheet: boolean = false) => {
        const localList = data.skillLibrary || [];
        const exists = localList.some(s => s.id === skillToSave.id);

        let newLibrary;
        if (exists) {
            newLibrary = localList.map(s => s.id === skillToSave.id ? skillToSave : s);
        } else {
            newLibrary = [...localList, skillToSave];
        }

        const newData = { ...data, skillLibrary: newLibrary };

        if (renameOnSheet && showRenameConfirm) {
            const oldName = showRenameConfirm.oldName.trim().toLowerCase();
            const newName = skillToSave.name.trim();

            const updatedSkills = { ...data.skills };
            Object.keys(updatedSkills).forEach(cat => {
                if (Array.isArray(updatedSkills[cat])) {
                    updatedSkills[cat] = updatedSkills[cat].map((s: import('../../types').DotEntry) =>
                        (s.name && s.name.trim().toLowerCase() === oldName)
                            ? { ...s, name: newName }
                            : s
                    );
                }
            });
            newData.skills = updatedSkills;
        }

        onUpdate(newData);
        addLog(`Compétence "${skillToSave.name}" enregistrée dans la réserve.`, 'success', 'settings');
        setIsSkillModalOpen(false);
        setEditingSkill(null);
        setSkillFormSource('local');
        setShowRenameConfirm(null);
    };

    const handleSaveSkill = (skillToSave: LibrarySkillEntry) => {
        if (!skillToSave.name.trim()) {
            setSkillError("Le nom de la compétence est requis.");
            return;
        }

        const duplicate = hybridSkills.find(m =>
            m.source === 'local' &&
            m.entry.id !== skillToSave.id &&
            m.entry.name.trim().toLowerCase() === skillToSave.name.trim().toLowerCase()
        );

        if (duplicate) {
            setSkillError("Une compétence portant ce nom existe déjà.");
            return;
        }

        const existingMerged = hybridSkills.find(m => m.entry.id === skillToSave.id);
        const existing = existingMerged ? existingMerged.entry : null;
        const nameChanged = existing && existing.name.trim().toLowerCase() !== skillToSave.name.trim().toLowerCase();
        const isUsed = existing && usedSkillNames.has(existing.name.trim().toLowerCase());

        if (nameChanged && isUsed) {
            setShowRenameConfirm({ oldName: existing.name, newSkill: skillToSave });
            setIsSkillModalOpen(false);
            return;
        }

        const cleanedSkill = {
            ...skillToSave,
            variants: skillToSave.variants ? skillToSave.variants.map(v => v.trim()).filter(v => v !== '') : []
        };

        finalizeSaveSkill(cleanedSkill);
    };

    const handleDeleteRequest = (merged: MergedEntry<LibrarySkillEntry>) => {
        if (merged.source === 'official') {
            addLog("Impossible de supprimer une compétence officielle.", "info", "settings");
            return;
        }
        setSkillToDelete(merged.entry);
    };

    const executeDeleteSkill = () => {
        if (!skillToDelete) return;
        const localList = data.skillLibrary || [];
        onUpdate({ ...data, skillLibrary: localList.filter(s => s.id !== skillToDelete.id) });
        addLog(`Compétence "${skillToDelete.name}" supprimée de la réserve.`, 'info', 'settings');
        setSkillToDelete(null);
    };

    const executeImportFromSheet = () => {
        const currentLib = JSON.parse(JSON.stringify(data.skillLibrary || []));
        const existingNames = new Set(currentLib.map((s: LibrarySkillEntry) => s.name.trim().toLowerCase()));
        let addedCount = 0;

        Object.keys(data.skills).forEach(key => {
            if (key === 'arrieres_plans') return;
            const sheetSkills = data.skills[key] || [];
            sheetSkills.forEach((skill: import('../../types').DotEntry) => {
                const normalized = skill.name ? skill.name.trim() : "";
                if (normalized && !existingNames.has(normalized.toLowerCase())) {
                    currentLib.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: skill.name,
                        description: "",
                        defaultCategory: key
                    });
                    existingNames.add(normalized.toLowerCase());
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            currentLib.sort((a: LibrarySkillEntry, b: LibrarySkillEntry) => a.name.localeCompare(b.name));
            onUpdate({ ...data, skillLibrary: currentLib });
            addLog(`${addedCount} compétence(s) importée(s) depuis la fiche.`, 'success', 'settings');
        } else {
            addLog("Toutes les compétences de la fiche sont déjà dans la réserve.", 'info', 'settings');
        }
        setShowImportConfirm(false);
    };

    return {
        skillSearch, setSkillSearch,
        hideKnownSkills, setHideKnownSkills,
        isSkillModalOpen, setIsSkillModalOpen,
        editingSkill, setEditingSkill,
        skillFormSource,
        skillError, setSkillError,
        showRenameConfirm, setShowRenameConfirm,
        showImportConfirm, setShowImportConfirm,
        skillToDelete, setSkillToDelete,
        hybridSkills,
        usedSkillNames,
        filteredSkills,
        handleOpenNewSkill,
        handleOpenEditSkill,
        handleSaveSkill,
        finalizeSaveSkill,
        handleDeleteRequest,
        executeDeleteSkill,
        executeImportFromSheet
    };
};
