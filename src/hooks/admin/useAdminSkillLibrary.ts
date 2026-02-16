import { useState, useMemo } from 'react';
import { RulesData } from '../../types/rules';
import { LibrarySkillEntry } from '../../types';
import { smartIncludes } from '../../utils/stringUtils';
import { disambiguateCategories } from '../../utils/categoryUtils';
import { CATEGORY_HELP } from '../../data/constants';
import { publishFileToGitHub } from '../../services/githubService';

/**
 * Hook to manage the state and logic for AdminSkillLibrary.
 * Extracts CRUD, filtering, and publishing logic from the component.
 */
export const useAdminSkillLibrary = (rules: RulesData, onUpdate: (newRules: RulesData) => void, globalUsage: Record<string, number> = {}) => {
    const list = rules.libraries?.skills || [];

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState<LibrarySkillEntry | null>(null);
    const [variantDraft, setVariantDraft] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showCategoryHelp, setShowCategoryHelp] = useState(false);

    // Advanced Filters
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [sourceFilter, setSourceFilter] = useState<boolean | null>(null);
    const [typeFilter, setTypeFilter] = useState<boolean | null>(null);
    const [usageFilter, setUsageFilter] = useState<boolean | null>(null);
    const [mysticFilter, setMysticFilter] = useState<boolean | null>(null);

    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
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
        return list
            .filter(s => {
                const matchesSearch = smartIncludes(s.name, searchTerm) || (s.description && smartIncludes(s.description, searchTerm));
                if (!matchesSearch) return false;

                if (activeFilter !== null) {
                    const isActive = s.isActive !== false;
                    if (activeFilter !== isActive) return false;
                }

                if (sourceFilter !== null) {
                    const isGlobal = s.isGlobal === true;
                    if (sourceFilter !== isGlobal) return false;
                }

                if (typeFilter !== null) {
                    const isVariable = s.isVariable === true;
                    if (typeFilter !== isVariable) return false;
                }

                if (usageFilter !== null) {
                    const isPlaced = placedSkillNames.has(s.name.trim().toLowerCase());
                    if (usageFilter !== isPlaced) return false;
                }

                if (mysticFilter !== null) {
                    const isMystic = !!s.mysticAbilityId;
                    if (mysticFilter !== isMystic) return false;
                }

                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [list, searchTerm, activeFilter, sourceFilter, typeFilter, usageFilter, mysticFilter, placedSkillNames]);

    const availableCategories = useMemo(() => {
        let rawCategories = [...CATEGORY_HELP];
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

    const handleOpenNew = () => {
        setError(null);
        setEditingSkill({
            id: crypto.randomUUID(),
            name: '',
            description: '',
            isVariable: false
        });
        setVariantDraft('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (skill: LibrarySkillEntry) => {
        setError(null);
        setEditingSkill({ ...skill });
        setVariantDraft(skill.variants?.join(', ') || '');
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setShowDeleteConfirm(id);
    };

    const confirmDelete = () => {
        if (!showDeleteConfirm) return;
        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, skills: list.filter(s => s.id !== showDeleteConfirm) }
        });
        setShowDeleteConfirm(null);
    };

    const handleSave = () => {
        if (!editingSkill) return;
        if (!editingSkill.name.trim()) { setError("Le nom est requis."); return; }

        const duplicate = list.find(s => s.id !== editingSkill.id && s.name.trim().toLowerCase() === editingSkill.name.trim().toLowerCase());
        if (duplicate) { setError("Une compétence portant ce nom existe déjà."); return; }

        const cleanedVariants = variantDraft
            .split(',')
            .map(v => v.trim())
            .filter(v => v !== '');

        const skillToSave = { ...editingSkill, variants: cleanedVariants };

        const newList = list.some(s => s.id === skillToSave.id)
            ? list.map(s => s.id === skillToSave.id ? skillToSave : s)
            : [...list, skillToSave];

        newList.sort((a, b) => a.name.localeCompare(b.name));

        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, skills: newList }
        });
        setIsModalOpen(false);
        setEditingSkill(null);
    };

    const toggleSkillActive = (skill: LibrarySkillEntry) => {
        const newList = list.map(s => s.id === skill.id ? { ...s, isActive: !s.isActive } : s);
        onUpdate({ ...rules, libraries: { ...rules.libraries, skills: newList } });
    };

    const handleBulkSelect = (active: boolean) => {
        const visibleIds = new Set(filteredList.map(s => s.id));
        const newList = list.map(skill =>
            visibleIds.has(skill.id) ? { ...skill, isActive: active } : skill
        );
        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, skills: newList }
        });
    };

    const handlePublishClick = () => {
        const token = localStorage.getItem('GITHUB_TOKEN');
        const owner = localStorage.getItem('GITHUB_OWNER');
        const repo = localStorage.getItem('GITHUB_REPO');

        if (!token || !owner || !repo) {
            setShowConfigAlert(true);
            return;
        }

        setShowPublishConfirm(true);
    };

    const executePublish = async () => {
        const token = localStorage.getItem('GITHUB_TOKEN') || '';
        const owner = localStorage.getItem('GITHUB_OWNER') || '';
        const repo = localStorage.getItem('GITHUB_REPO') || '';

        try {
            const content = JSON.stringify({
                meta: {
                    version: rules.version,
                    date: new Date().toISOString(),
                    type: 'skills'
                },
                data: list
            }, null, 2);

            const result = await publishFileToGitHub(
                'public/data/skills.json',
                content,
                `update(skills): Mise à jour bibliothèque compétences v${rules.version}`,
                { token, owner, repo, branch: 'main' }
            );

            if (result.success) {
                setPublishResult({ success: true, message: "Bibliothèque de compétences publiée avec succès !" });
            } else {
                setPublishResult({ success: false, message: "Erreur lors de la publication : " + result.message });
            }
        } catch (e) {
            setPublishResult({ success: false, message: "Erreur inattendue : " + (e as Error).message });
        }
    };

    return {
        list,
        searchTerm, setSearchTerm,
        isModalOpen, setIsModalOpen,
        editingSkill, setEditingSkill,
        variantDraft, setVariantDraft,
        error, setError,
        showCategoryHelp, setShowCategoryHelp,
        activeFilter, setActiveFilter,
        sourceFilter, setSourceFilter,
        typeFilter, setTypeFilter,
        usageFilter, setUsageFilter,
        mysticFilter, setMysticFilter,
        showPublishConfirm, setShowPublishConfirm,
        showDeleteConfirm, setShowDeleteConfirm,
        publishResult, setPublishResult,
        showConfigAlert, setShowConfigAlert,
        placedSkillNames,
        filteredList,
        availableCategories,
        getCategoryLabel,
        handleOpenNew,
        handleOpenEdit,
        handleDelete,
        toggleSkillActive,
        confirmDelete,
        handleSave,
        handleBulkSelect,
        handlePublishClick,
        executePublish
    };
};
