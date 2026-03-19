import { useMemo, useCallback, useState } from 'react';
import { RulesData } from '../../types/rules';
import { LibrarySpecializationEntry } from '../../types';
import { useAdminLibrary } from '../useAdminLibrary';
import { useNotification } from '../../context/NotificationContext';
import { publishFileToGitHub } from '../../services/githubService';

export const useAdminSpecializationLibrary = (
    rules: RulesData,
    onUpdate: (newRules: RulesData) => void,
    globalUsage: Record<string, number> = {}
) => {
    const addLog = useNotification();

    const admin = useAdminLibrary<LibrarySpecializationEntry, RulesData>({
        data: rules,
        onUpdate,
        addLog,
        collectionKey: 'libraries.specializations',
        itemName: 'Spécialité',
        disableMerge: true
    });

    const library = admin.hybridList.map(m => m.entry);

    const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('');
    const [skillFilterSearch, setSkillFilterSearch] = useState('');
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
    const [skillSearch, setSkillSearch] = useState('');
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);

    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];

        if (rules.definitions && rules.definitions.skills) {
            Object.values(rules.definitions.skills).forEach(categorySkills => {
                categorySkills.forEach(skillName => {
                    if (skillName && skillName.trim() !== '') {
                        skills.push({ id: skillName, name: skillName });
                    }
                });
            });
        }

        if (rules.libraries) {
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
    }, [rules.definitions, rules.libraries]);

    const filteredLibrary = useMemo(() => {
        return admin.filteredLibrary.map(m => m.entry).filter(s => {
            const matchesSkill = !selectedSkillFilter || s.skillIds.includes(selectedSkillFilter);
            return matchesSkill;
        });
    }, [admin.filteredLibrary, selectedSkillFilter]);

    const filteredSkillsForModal = useMemo(() => {
        return allSkills.filter(s =>
            (s.name.toLowerCase().includes(skillSearch.toLowerCase())) ||
            (admin.editingEntry?.skillIds.includes(s.id))
        );
    }, [allSkills, skillSearch, admin.editingEntry?.skillIds]);

    const filteredSkillsForFilter = useMemo(() => {
        if (!skillFilterSearch.trim()) return [];
        return allSkills.filter(s => s.name.toLowerCase().includes(skillFilterSearch.toLowerCase()));
    }, [allSkills, skillFilterSearch]);

    const handleOpenNew = useCallback(() => {
        admin.handleOpenNew({
            id: crypto.randomUUID(),
            name: '',
            skillIds: [],
            defaultMinLevel: 1,
            description: ''
        });
        setSkillSearch('');
    }, [admin]);

    const handleOpenEdit = useCallback((entry: LibrarySpecializationEntry) => {
        admin.handleOpenEdit({ entry, source: 'local' });
        setSkillSearch('');
    }, [admin]);

    const handleToggle = useCallback((id: string, currentlyActive: boolean) => {
        const newList = library.map(s => s.id === id ? { ...s, isActive: !currentlyActive } : s);
        onUpdate({ ...rules, libraries: { ...rules.libraries, specializations: newList } });
    }, [library, onUpdate, rules]);

    const handleBulkSelect = useCallback((active: boolean) => {
        const visibleIds = new Set(filteredLibrary.map(s => s.id));
        const newList = library.map(item =>
            visibleIds.has(item.id) ? { ...item, isActive: active } : item
        );
        onUpdate({ ...rules, libraries: { ...rules.libraries, specializations: newList } });
    }, [filteredLibrary, library, onUpdate, rules]);

    const handlePublishClick = useCallback(() => {
        const token = localStorage.getItem('GITHUB_TOKEN');
        const owner = localStorage.getItem('GITHUB_OWNER');
        const repo = localStorage.getItem('GITHUB_REPO');

        if (!token || !owner || !repo) {
            addLog("Veuillez d'abord configurer vos identifiants GitHub via le bouton 'Publier' du menu principal.", 'danger', 'settings');
            return;
        }
        setShowPublishConfirm(true);
    }, [addLog]);

    const executePublish = async () => {
        const token = localStorage.getItem('GITHUB_TOKEN') || '';
        const owner = localStorage.getItem('GITHUB_OWNER') || '';
        const repo = localStorage.getItem('GITHUB_REPO') || '';

        try {
            const content = JSON.stringify({
                meta: {
                    version: rules.version,
                    date: new Date().toISOString(),
                    type: 'specializations'
                },
                data: rules.libraries.specializations || []
            }, null, 2);

            const result = await publishFileToGitHub(
                'public/data/specializations.json',
                content,
                `update(specs): Mise à jour bibliothèque spécialités v${rules.version}`,
                { token, owner, repo, branch: 'main' }
            );

            if (result.success) {
                addLog('Bibliothèque de spécialités publiée avec succès !', 'success', 'settings');
            } else {
                addLog("Erreur lors de la publication : " + result.message, 'danger', 'settings');
            }
        } catch (e) {
            addLog("Erreur inattendue lors de la publication : " + (e as Error).message, 'danger', 'settings');
        } finally {
            setShowPublishConfirm(false);
        }
    };

    const handleSave = useCallback(() => {
        if (admin.editingEntry) {
            admin.handleSave(admin.editingEntry);
        }
    }, [admin]);

    return {
        searchTerm: admin.searchTerm, setSearchTerm: admin.setSearchTerm,
        isModalOpen: admin.isModalOpen, setIsModalOpen: admin.setIsModalOpen,
        editingEntry: admin.editingEntry, setEditingEntry: admin.setEditingEntry,
        error: admin.error,
        selectedSkillFilter, setSelectedSkillFilter,
        skillFilterSearch, setSkillFilterSearch,
        showSkillSuggestions, setShowSkillSuggestions,
        skillSearch, setSkillSearch,
        showPublishConfirm, setShowPublishConfirm,
        showDeleteConfirm: admin.entryToDelete?.id || null, setShowDeleteConfirm: (id: string | null) => admin.setEntryToDelete(id ? library.find(s => s.id === id) || null : null),
        library,
        allSkills,
        filteredLibrary,
        filteredSkillsForModal,
        filteredSkillsForFilter,
        handleOpenNew,
        handleOpenEdit,
        handleDelete: (id: string) => admin.setEntryToDelete(library.find(s => s.id === id) || null),
        confirmDelete: admin.executeDelete,
        handleSave,
        handleToggle,
        handleBulkSelect,
        handlePublishClick,
        executePublish
    };
};
