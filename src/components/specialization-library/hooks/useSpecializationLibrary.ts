import { useState, useMemo, useCallback } from 'react';
import { CharacterSheetData, LibrarySpecializationEntry } from '../../../types';
import { useNotification } from '../../../context/NotificationContext';
import { useRules } from '../../../context/RulesContext';
import { useAdminLibrary } from '../../../hooks/useAdminLibrary';
import { smartIncludes } from '../../../utils/stringUtils';

interface UseSpecializationLibraryProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
}

export const useSpecializationLibrary = ({ data, onUpdate }: UseSpecializationLibraryProps) => {
    const addLog = useNotification();
    const { rules } = useRules();

    const [hideKnown, setHideKnown] = useState(false);
    const [skillSearch, setSkillSearch] = useState('');

    const onImport = useCallback((currentLib: LibrarySpecializationEntry[]) => {
        const existingNames = new Set(currentLib.map((e) => e.name.trim().toLowerCase()));
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

        return { addedCount, updatedLib: currentLib };
    }, [data.specializations, data.imposedSpecializations]);

    const admin = useAdminLibrary<LibrarySpecializationEntry>({
        data,
        onUpdate,
        addLog,
        collectionKey: 'specializationLibrary',
        officialLibraryKey: 'specializations',
        itemName: 'Spécialité',
        onImport
    });

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

    // Déterminer quelles spécialités sont déjà utilisées sur la fiche
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
        return admin.hybridList.filter((m: any) => {
            const matchesSearch = smartIncludes(m.entry.name, admin.searchTerm) ||
                (m.entry.description && smartIncludes(m.entry.description, admin.searchTerm));

            const isUsed = usedSpecializations.has(m.entry.name.trim().toLowerCase());
            const matchesFilter = hideKnown ? !isUsed : true;

            return matchesSearch && matchesFilter;
        }).sort((a, b) => a.entry.name.localeCompare(b.entry.name));
    }, [admin.hybridList, admin.searchTerm, hideKnown, usedSpecializations]);

    const handleOpenNew = useCallback(() => {
        admin.handleOpenNew({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            skillIds: [],
            defaultMinLevel: 1,
            description: '',
            isImposed: false
        });
        setSkillSearch('');
    }, [admin]);

    return {
        ...admin,
        hideKnown, setHideKnown,
        skillSearch, setSkillSearch,
        allSkills,
        usedSpecializations,
        filteredLibrary,
        hasItems: admin.hybridList.length > 0,
        handleOpenNew
    };
};

