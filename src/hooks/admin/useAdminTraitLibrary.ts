import { useState, useMemo, useCallback } from 'react';
import { RulesData } from '../../types/rules';
import { LibraryEntry, TraitEffect } from '../../types';
import { smartIncludes, normalizeString } from '../../utils/stringUtils';
import { publishFileToGitHub } from '../../services/githubService';

interface UseAdminTraitLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

export type SortOption = 'name' | 'cost' | 'type';
export type SortOrder = 'asc' | 'desc';
export type AuditMode = 'incomplete' | 'complex' | 'popular' | 'unused' | 'duplicates' | null;

export const useAdminTraitLibrary = ({ rules, onUpdate, globalUsage = {} }: UseAdminTraitLibraryProps) => {
    // Safe access to library
    const library = rules.libraries?.traits || [];

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Advanced Filters
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [sourceFilter, setSourceFilter] = useState<boolean | null>(null);
    const [typeFilter, setTypeFilter] = useState<boolean | null>(null); // true = Avantage, false = Desavantage

    // Property Filters (icon toggles)
    const [filterEffects, setFilterEffects] = useState(false);
    const [filterCounter, setFilterCounter] = useState(false);
    const [filterXP, setFilterXP] = useState(false);
    const [filterVariants, setFilterVariants] = useState(false);

    // Audit Mode
    const [auditMode, setAuditMode] = useState<AuditMode>(null);

    // Sorting
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // UI States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<LibraryEntry | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Modals State
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showConfigAlert, setShowConfigAlert] = useState(false);

    // Compute derived data for the Form (Skills & Attributes) from Rules
    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];
        if (!rules.definitions.skills) return skills;

        Object.keys(rules.definitions.skills).forEach(cat => {
            rules.definitions.skills[cat].forEach(s => {
                if (s && s.trim() !== '') {
                    skills.push({ id: s, name: s });
                }
            });
        });
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions.skills]);

    const allAttributes = useMemo(() => {
        const attrs: { id: string, name: string }[] = [];
        if (!rules.definitions.attributes) return attrs;

        Object.keys(rules.definitions.attributes).forEach(cat => {
            rules.definitions.attributes[cat].forEach(a => {
                attrs.push({ id: a, name: a });
            });
            if (rules.configurations.global.secondaryAttributes && rules.definitions.secondaryAttributes?.[cat]) {
                rules.definitions.secondaryAttributes[cat].forEach(a => {
                    attrs.push({ id: a, name: a });
                });
            }
        });
        return attrs.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions.attributes, rules.configurations.global.secondaryAttributes, rules.definitions.secondaryAttributes]);

    const allCounters = useMemo(() => {
        const counters: { id: string, name: string }[] = [];
        if (!rules.definitions.counters) return counters;

        Object.values(rules.definitions.counters).forEach(c => {
            if (c.name && c.name.trim() !== '') {
                counters.push({ id: c.id, name: c.name });
            }
        });
        return counters.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions.counters]);

    const allFormulas = rules.libraries?.formulas || [];

    // Helpers
    const handleOpenNew = useCallback(() => {
        setError(null);
        setTagInput('');
        setEditForm({
            id: crypto.randomUUID(),
            name: '',
            type: typeFilter === false ? 'desavantage' : 'avantage',
            cost: '1',
            pointsLabel: '1',
            isVariableCost: false,
            description: '',
            tags: [],
            effects: []
        });
        setIsModalOpen(true);
    }, [typeFilter]);

    const handleOpenEdit = useCallback((entry: LibraryEntry) => {
        setError(null);
        setTagInput('');
        setEditForm({
            ...entry,
            tags: [...(entry.tags || [])],
            effects: (entry.effects || []).map(e => ({ ...e, id: e.id || crypto.randomUUID() }))
        });
        setIsModalOpen(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!showDeleteConfirm) return;

        const newLibrary = library.filter(l => l.id !== showDeleteConfirm);
        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                traits: newLibrary
            }
        });
        setShowDeleteConfirm(null);
        setShowDeleteConfirm(null);
    }, [library, onUpdate, rules, showDeleteConfirm]);

    const handleSave = useCallback((updatedTrait?: LibraryEntry) => {
        const baseTrait = updatedTrait || editForm;
        if (!baseTrait) return;

        // Clone to safely modify effects
        const traitToSave = { ...baseTrait, effects: [...(baseTrait.effects || []).map(e => ({ ...e }))] };

        if (!traitToSave.name.trim()) { setError("Le nom est requis."); return; }

        const duplicate = library.find(l => l.id !== traitToSave.id && l.name.trim().toLowerCase() === traitToSave.name.trim().toLowerCase());
        if (duplicate) { setError("Un trait avec ce nom existe déjà."); return; }

        const existingTrait = library.find(l => l.id === traitToSave.id);

        const newLibrary = existingTrait
            ? library.map(l => l.id === traitToSave.id ? traitToSave : l)
            : [traitToSave, ...library];

        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                traits: newLibrary
            }
        });
        setIsModalOpen(false);
        setEditForm(null);
    }, [editForm, library, onUpdate, rules]);

    const handleBulkSelect = useCallback((active: boolean) => {
        // We'll need the processed list for this, so we compute it or pass it.
        // Actually, better to compute it here too.
    }, []);

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
                meta: {
                    version: rules.version,
                    date: new Date().toISOString(),
                    type: 'traits'
                },
                data: library
            }, null, 2);

            const result = await publishFileToGitHub(
                'public/data/traits.json',
                content,
                `update(traits): Mise à jour bibliothèque traits v${rules.version}`,
                { token, owner, repo, branch: 'main' }
            );

            if (result.success) {
                setPublishResult({ success: true, message: "Bibliothèque de traits publiée avec succès !" });
            } else {
                setPublishResult({ success: false, message: "Erreur lors de la publication : " + result.message });
            }
        } catch (e) {
            setPublishResult({ success: false, message: "Erreur inattendue : " + (e as Error).message });
        }
    }, [library, rules.version]);

    // Filter & Sort Logic
    const duplicateIds = useMemo(() => {
        const normalized = library.map(e => ({ id: e.id, key: normalizeString(e.name).replace(/\s+/g, '') }));
        const seen = new Map<string, string>();
        const dupes = new Set<string>();
        normalized.forEach(({ id, key }) => {
            // Check if any existing key is a prefix or substring of current (min 4 chars)
            for (const [existingKey, existingId] of seen.entries()) {
                const shorter = key.length < existingKey.length ? key : existingKey;
                const longer = key.length < existingKey.length ? existingKey : key;
                if (shorter.length >= 4 && longer.startsWith(shorter)) {
                    dupes.add(id);
                    dupes.add(existingId);
                }
            }
            seen.set(key, id);
        });
        return dupes;
    }, [library]);

    const processedList = useMemo(() => {
        const list = library.filter(entry => {
            const entryTags = entry.tags || [];
            const matchesSearch = smartIncludes(entry.name, searchTerm) ||
                smartIncludes(entry.description || "", searchTerm) ||
                entryTags.some(t => smartIncludes(t, searchTerm));

            const matchesType = typeFilter === null || (typeFilter ? entry.type === 'avantage' : entry.type === 'desavantage');
            const matchesActive = activeFilter === null || (entry.isActive !== false) === activeFilter;
            const matchesSource = sourceFilter === null || (entry.isGlobal === true) === sourceFilter;

            const matchesTags = selectedTags.length === 0 || selectedTags.every(sel =>
                entryTags.some(t => t.toLowerCase() === sel.toLowerCase())
            );

            // Property icon filters
            const matchesEffects = !filterEffects || (entry.effects && entry.effects.length > 0);
            const matchesCounter = !filterCounter || !!entry.hasAutoCounter;
            const matchesXP = !filterXP || !!entry.isXPUpgradeable;
            const matchesVariants = !filterVariants || (entry.variants && entry.variants.length > 0);

            // Audit mode
            let matchesAudit = true;
            if (auditMode === 'incomplete') {
                matchesAudit = !entry.description?.trim() || !entry.tags || entry.tags.length === 0;
            } else if (auditMode === 'complex') {
                matchesAudit = (entry.effects || []).some(e => e.type === 'formula');
            } else if (auditMode === 'popular') {
                matchesAudit = (globalUsage[entry.id] || 0) > 0;
            } else if (auditMode === 'unused') {
                matchesAudit = (globalUsage[entry.id] || 0) === 0;
            } else if (auditMode === 'duplicates') {
                matchesAudit = duplicateIds.has(entry.id);
            }

            return matchesSearch && matchesType && matchesActive && matchesSource && matchesTags
                && matchesEffects && matchesCounter && matchesXP && matchesVariants && matchesAudit;
        });

        list.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
            else if (sortBy === 'cost') comparison = (parseInt(a.cost || "0") || 0) - (parseInt(b.cost || "0") || 0);
            else if (sortBy === 'type') comparison = a.type.localeCompare(b.type);

            if (comparison === 0) return a.name.localeCompare(b.name);
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return list;
    }, [library, searchTerm, typeFilter, activeFilter, sourceFilter, selectedTags, sortBy, sortOrder,
        filterEffects, filterCounter, filterXP, filterVariants, auditMode, duplicateIds, globalUsage]);

    const allAvailableTags = useMemo(() => {
        const tags = new Set<string>();
        library.forEach(l => (l.tags || []).forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [library]);

    // Tag and Effect manipulation
    const addTag = useCallback(() => {
        if (!editForm || !tagInput.trim()) return;
        const newTag = tagInput.trim();
        if (!(editForm.tags || []).includes(newTag)) {
            setEditForm({ ...editForm, tags: [...(editForm.tags || []), newTag] });
        }
        setTagInput('');
    }, [editForm, tagInput]);

    const removeTag = useCallback((t: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, tags: (editForm.tags || []).filter(tag => tag !== t) });
    }, [editForm]);

    const addEffect = useCallback(() => {
        if (!editForm) return;
        const newEffect: TraitEffect = { id: crypto.randomUUID(), type: 'formula', value: 0 };
        setEditForm({ ...editForm, effects: [...(editForm.effects || []), newEffect] });
    }, [editForm]);

    const updateEffect = useCallback(<K extends keyof TraitEffect>(
        id: string,
        field: K,
        value: TraitEffect[K]
    ) => {
        setEditForm(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                effects: (prev.effects || []).map(e => e.id === id ? { ...e, [field]: value } as TraitEffect : e)
            };
        });
    }, []);

    const updateEffectFields = useCallback((id: string, updates: Partial<TraitEffect>) => {
        setEditForm(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                effects: (prev.effects || []).map(e => e.id === id ? { ...e, ...updates } : e)
            };
        });
    }, []);

    const removeEffect = useCallback((id: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, effects: (editForm.effects || []).filter(e => e.id !== id) });
    }, [editForm]);

    const wrappedHandleBulkSelect = useCallback((active: boolean) => {
        const visibleIds = new Set(processedList.map(t => t.id));
        const newList = library.map(trait =>
            visibleIds.has(trait.id) ? { ...trait, isActive: active } : trait
        );
        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                traits: newList
            }
        });
    }, [library, onUpdate, processedList, rules]);

    const handleToggleActive = useCallback((id: string) => {
        const newList = library.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t);
        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                traits: newList
            }
        });
    }, [library, onUpdate, rules]);

    return {
        // States
        searchTerm, setSearchTerm,
        selectedTags, setSelectedTags,
        activeFilter, setActiveFilter,
        sourceFilter, setSourceFilter,
        typeFilter, setTypeFilter,
        sortBy, setSortBy,
        sortOrder, setSortOrder,
        isModalOpen, setIsModalOpen,
        editForm, setEditForm,
        tagInput, setTagInput,
        error, setError,
        showPublishConfirm, setShowPublishConfirm,
        showDeleteConfirm, setShowDeleteConfirm,
        publishResult, setPublishResult,
        showConfigAlert, setShowConfigAlert,

        // Property filters
        filterEffects, setFilterEffects,
        filterCounter, setFilterCounter,
        filterXP, setFilterXP,
        filterVariants, setFilterVariants,

        // Audit mode
        auditMode, setAuditMode,
        duplicateIds,

        // Derived Data
        library,
        processedList,
        allAvailableTags,
        allSkills,
        allAttributes,
        allCounters,
        allFormulas,

        // Handlers
        handleOpenNew,
        handleOpenEdit,
        handleDelete: (id: string) => setShowDeleteConfirm(id),
        confirmDelete,
        handleSave,
        handleBulkSelect: wrappedHandleBulkSelect,
        handleToggleActive,
        handlePublishClick,
        executePublish,
        addTag,
        removeTag,
        addEffect,
        updateEffect,
        updateEffectFields,
        removeEffect
    };
};
