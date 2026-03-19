import { useState, useMemo, useCallback } from 'react';
import { RulesData } from '../../types/rules';
import { LibrarySkillEntry } from '../../types';
import { smartIncludes } from '../../utils/stringUtils';
import { disambiguateCategories } from '../../utils/categoryUtils';
import { CATEGORY_HELP } from '../../constants/app';
import { publishFileToGitHub } from '../../services/githubService';
import { useAdminLibrary } from '../useAdminLibrary';
import { useNotification } from '../../context/NotificationContext';

export const useAdminSkillLibrary = (
    rules: RulesData,
    onUpdate: (newRules: RulesData) => void,
    _globalUsage: Record<string, number> = {},
    mode: 'global' | 'override' = 'global'
) => {
    const addLog = useNotification();
    
    const admin = useAdminLibrary<LibrarySkillEntry, RulesData>({
        data: rules,
        onUpdate,
        addLog,
        collectionKey: 'libraries.skills',
        officialLibraryKey: 'skills',
        itemName: 'Compétence',
        disableMerge: true
    });

    const list = admin.hybridList.map(m => m.entry);

    const [variantDraft, setVariantDraft] = useState('');
    const [showCategoryHelp, setShowCategoryHelp] = useState(false);

    // Filters
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [sourceFilter, setSourceFilter] = useState<boolean | null>(null);
    const [typeFilter, setTypeFilter] = useState<boolean | null>(null); // isVariable
    const [usageFilter, setUsageFilter] = useState<boolean | null>(null);
    const [mysticFilter, setMysticFilter] = useState<boolean | null>(null);

    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showConfigAlert, setShowConfigAlert] = useState(false);

    const placedSkillNames = useMemo(() => {
        const names = new Set<string>();
        if (rules.definitions.skills) {
            Object.values(rules.definitions.skills).forEach((skillsArray) => {
                (skillsArray as string[]).forEach(name => {
                    if (name.trim()) names.add(name.trim().toLowerCase());
                });
            });
        }
        return names;
    }, [rules.definitions.skills]);

    const filteredList = useMemo(() => {
        return list.filter(s => {
            const matchesSearch = smartIncludes(s.name, admin.searchTerm) || (s.description && smartIncludes(s.description, admin.searchTerm));
            if (!matchesSearch) return false;

            if (activeFilter !== null && (s.isActive !== false) !== activeFilter) return false;
            if (sourceFilter !== null && (s.isGlobal === true) !== sourceFilter) return false;
            if (typeFilter !== null && (s.isVariable === true) !== typeFilter) return false;
            if (usageFilter !== null && placedSkillNames.has(s.name.trim().toLowerCase()) !== usageFilter) return false;
            if (mysticFilter !== null && (!!s.mysticAbilityId) !== mysticFilter) return false;

            return true;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [list, admin.searchTerm, activeFilter, sourceFilter, typeFilter, usageFilter, mysticFilter, placedSkillNames]);

    const availableCategories = useMemo(() => {
        let rawCategories: { code: string; label: string; loc: string }[] = [...CATEGORY_HELP];
        if (rules.definitions.skillCategories && rules.definitions.skillCategories.length > 0) {
            rawCategories = rules.definitions.skillCategories.map(cat => ({
                code: cat.id,
                label: cat.label,
                loc: cat.description || ""
            }));
        }
        return disambiguateCategories(rawCategories);
    }, [rules.definitions.skillCategories]);

    const getCategoryLabel = (code: string) => {
        return availableCategories.find(c => c.code === code)?.label || code;
    };

    const handleOpenNew = useCallback(() => {
        admin.handleOpenNew({
            id: crypto.randomUUID(),
            name: '',
            description: '',
            isVariable: false
        });
        setVariantDraft('');
    }, [admin]);

    const handleOpenEdit = useCallback((skill: LibrarySkillEntry) => {
        const skillWithMaster = { ...skill };
        if (!!rules.settingId && !skillWithMaster.isCustomized && !skillWithMaster.masterDefinition) {
            skillWithMaster.masterDefinition = {
                name: skill.name,
                description: skill.description || '',
                isVariable: !!skill.isVariable,
                mysticAbilityId: skill.mysticAbilityId || undefined,
                defaultCategory: skill.defaultCategory || undefined
            };
        }
        admin.handleOpenEdit({ entry: { ...skillWithMaster, mysticAbilityId: skillWithMaster.mysticAbilityId || "" }, source: 'local' });
        setVariantDraft(skillWithMaster.variants?.join(', ') || '');
    }, [admin, rules.settingId]);

    const handleSave = useCallback(() => {
        if (!admin.editingEntry) return;
        const cleanedVariants = variantDraft.split(',').map(v => v.trim()).filter(v => v !== '');
        const skillToSave: LibrarySkillEntry = {
            ...admin.editingEntry,
            variants: cleanedVariants,
            isCustomized: (mode === 'override' && !!rules.settingId) ? true : admin.editingEntry.isCustomized
        };
        admin.handleSave(skillToSave);
    }, [admin, variantDraft, mode, rules.settingId]);

    const handleReset = useCallback((skillId: string) => {
        const skill = list.find(s => s.id === skillId);
        if (!skill) return;

        let resetSkill: LibrarySkillEntry;
        if (skill.masterDefinition) {
            resetSkill = {
                ...skill,
                name: skill.masterDefinition.name,
                description: skill.masterDefinition.description,
                isVariable: skill.masterDefinition.isVariable,
                mysticAbilityId: skill.masterDefinition.mysticAbilityId || "",
                defaultCategory: skill.masterDefinition.defaultCategory,
                isCustomized: false,
            };
        } else {
            resetSkill = { ...skill, isCustomized: false };
        }
        admin.handleSave(resetSkill);
    }, [admin, list]);

    const toggleSkillActive = useCallback((skill: LibrarySkillEntry) => {
        admin.handleSave({ ...skill, isActive: !skill.isActive });
    }, [admin]);

    const handleBulkSelect = useCallback((active: boolean) => {
        const visibleIds = new Set(filteredList.map(s => s.id));
        const newList = list.map(skill => visibleIds.has(skill.id) ? { ...skill, isActive: active } : skill);
        onUpdate({ ...rules, libraries: { ...rules.libraries, skills: newList } });
    }, [filteredList, list, onUpdate, rules]);

    const handlePublishClick = useCallback(() => {
        const token = localStorage.getItem('GITHUB_TOKEN');
        const owner = localStorage.getItem('GITHUB_OWNER');
        const repo = localStorage.getItem('GITHUB_REPO');
        if (!token || !owner || !repo) {
            setShowConfigAlert(true);
            return;
        }
        setShowPublishConfirm(true);
    }, []);

    const executePublish = useCallback(async () => {
        const token = localStorage.getItem('GITHUB_TOKEN') || '';
        const owner = localStorage.getItem('GITHUB_OWNER') || '';
        const repo = localStorage.getItem('GITHUB_REPO') || '';
        try {
            const content = JSON.stringify({
                meta: { version: rules.version, date: new Date().toISOString(), type: 'skills' },
                data: list
            }, null, 2);
            const settingSlug = rules.settingName ? rules.settingName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '_') : '';
            const fileName = (rules.settingId && settingSlug) ? `public/data/skills_${settingSlug}.json` : 'public/data/skills.json';
            const result = await publishFileToGitHub(
                fileName,
                content,
                `update(skills): Mise à jour bibliothèque compétences ${rules.settingName || ''} v${rules.version}`,
                { token, owner, repo, branch: 'main' }
            );
            if (result.success) setPublishResult({ success: true, message: "Bibliothèque de compétences publiée avec succès !" });
            else setPublishResult({ success: false, message: "Erreur lors de la publication : " + result.message });
        } catch (e) {
            setPublishResult({ success: false, message: "Erreur inattendue : " + (e as Error).message });
        }
        setShowPublishConfirm(false);
    }, [list, rules]);

    return {
        list,
        searchTerm: admin.searchTerm, setSearchTerm: admin.setSearchTerm,
        isModalOpen: admin.isModalOpen, setIsModalOpen: admin.setIsModalOpen,
        editingSkill: admin.editingEntry, setEditingSkill: admin.setEditingEntry,
        variantDraft, setVariantDraft,
        error: admin.error,
        showCategoryHelp, setShowCategoryHelp,
        activeFilter, setActiveFilter,
        sourceFilter, setSourceFilter,
        typeFilter, setTypeFilter,
        usageFilter, setUsageFilter,
        mysticFilter, setMysticFilter,
        showPublishConfirm, setShowPublishConfirm,
        showDeleteConfirm: admin.entryToDelete?.id || null, setShowDeleteConfirm: (id: string | null) => admin.setEntryToDelete(id ? list.find(l => l.id === id) || null : null),
        publishResult, setPublishResult,
        showConfigAlert, setShowConfigAlert,
        placedSkillNames,
        filteredList,
        availableCategories,
        getCategoryLabel,
        handleOpenNew,
        handleOpenEdit,
        handleDelete: (id: string) => admin.setEntryToDelete(list.find(l => l.id === id) || null),
        toggleSkillActive,
        confirmDelete: admin.executeDelete,
        handleSave,
        handleReset,
        handleBulkSelect,
        handlePublishClick,
        executePublish
    };
};
