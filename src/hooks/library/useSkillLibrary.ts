import { useState, useMemo, useCallback } from 'react';
import { LibrarySkillEntry, CharacterSheetData, DotEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { useAdminLibrary } from '../useAdminLibrary';

export const useSkillLibrary = (
    data: CharacterSheetData,
    rules: RulesData | null,
    onUpdate: (newData: CharacterSheetData) => void,
    addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void
) => {
    const [skillSearch, setSkillSearch] = useState('');
    const [hideKnownSkills, setHideKnownSkills] = useState(true);
    const [showRenameConfirm, setShowRenameConfirm] = useState<{ oldName: string, newSkill: LibrarySkillEntry } | null>(null);

    const onImport = useCallback((currentLib: LibrarySkillEntry[]) => {
        const existingNames = new Set(currentLib.map((s) => s.name.trim().toLowerCase()));
        let addedCount = 0;

        Object.keys(data.skills || {}).forEach(key => {
            if (key === 'arrieres_plans') return;
            const sheetSkills = (data.skills as any)[key] || [];
            sheetSkills.forEach((skill: DotEntry) => {
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

        return { addedCount, updatedLib: currentLib };
    }, [data.skills]);

    const admin = useAdminLibrary<LibrarySkillEntry>({
        data,
        onUpdate,
        addLog,
        collectionKey: 'skillLibrary',
        officialLibraryKey: 'skills',
        itemName: 'Compétence',
        onImport
    });

    const usedSkillNames = useMemo(() => {
        const names = new Set<string>();
        if (data.skills) {
            Object.keys(data.skills).forEach(key => {
                const list = (data.skills as any)[key] || [];
                list.forEach((s: DotEntry) => {
                    if (s.name && s.name.trim() !== '') {
                        names.add(s.name.trim().toLowerCase());
                    }
                });
            });
        }
        return names;
    }, [data.skills]);

    const filteredSkills = useMemo(() => {
        return admin.hybridList.filter(m => {
            const matchesSearch = (admin.searchTerm === '' || 
                admin.hybridList.some(h => h.entry.id === m.entry.id && (
                    h.entry.name.toLowerCase().includes(admin.searchTerm.toLowerCase()) ||
                    (h.entry.description && h.entry.description.toLowerCase().includes(admin.searchTerm.toLowerCase()))
                ))
            );
            // Re-implementing a bit of logic because admin.searchTerm and skillSearch are distinct if I don't sync them
            // Actually, I should use admin.searchTerm directly in the UI later.
            return (
                (m.entry.name.toLowerCase().includes(admin.searchTerm.toLowerCase()) ||
                (m.entry.description && m.entry.description.toLowerCase().includes(admin.searchTerm.toLowerCase()))) &&
                (hideKnownSkills ? !usedSkillNames.has(m.entry.name.trim().toLowerCase()) : true)
            );
        }).sort((a, b) => a.entry.name.localeCompare(b.entry.name));
    }, [admin.hybridList, admin.searchTerm, hideKnownSkills, usedSkillNames]);

    const handleOpenNewSkill = () => {
        admin.handleOpenNew({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            description: ''
        });
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

            const updatedSkills = { ...data.skills } as any;
            Object.keys(updatedSkills).forEach(cat => {
                if (Array.isArray(updatedSkills[cat])) {
                    updatedSkills[cat] = updatedSkills[cat].map((s: DotEntry) =>
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
        admin.setIsModalOpen(false);
        admin.setEditingEntry(null);
        setShowRenameConfirm(null);
    };

    const handleSaveSkill = (skillToSave: LibrarySkillEntry) => {
        if (!skillToSave.name.trim()) {
            admin.setError("Le nom de la compétence est requis.");
            return;
        }

        const duplicate = admin.hybridList.find(m =>
            m.source === 'local' &&
            m.entry.id !== skillToSave.id &&
            m.entry.name.trim().toLowerCase() === skillToSave.name.trim().toLowerCase()
        );

        if (duplicate) {
            admin.setError("Une compétence portant ce nom existe déjà.");
            return;
        }

        const existingMerged = admin.hybridList.find(m => m.entry.id === skillToSave.id);
        const existing = existingMerged ? existingMerged.entry : null;
        const nameChanged = existing && existing.name.trim().toLowerCase() !== skillToSave.name.trim().toLowerCase();
        const isUsed = existing && usedSkillNames.has(existing.name.trim().toLowerCase());

        if (nameChanged && isUsed) {
            setShowRenameConfirm({ oldName: existing.name, newSkill: skillToSave });
            admin.setIsModalOpen(false);
            return;
        }

        const cleanedSkill = {
            ...skillToSave,
            variants: skillToSave.variants ? skillToSave.variants.map(v => v.trim()).filter(v => v !== '') : []
        };

        finalizeSaveSkill(cleanedSkill);
    };

    return {
        ...admin,
        skillSearch: admin.searchTerm, setSkillSearch: admin.setSearchTerm,
        hideKnownSkills, setHideKnownSkills,
        showRenameConfirm, setShowRenameConfirm,
        hybridSkills: admin.hybridList,
        usedSkillNames,
        filteredSkills,
        handleOpenNewSkill,
        handleOpenEditSkill: admin.handleOpenEdit,
        handleSaveSkill,
        finalizeSaveSkill,
        handleDeleteRequest: admin.handleDeleteRequest,
        executeDeleteSkill: admin.executeDelete,
        executeImportFromSheet: admin.executeImportFromSheet
    };
};

