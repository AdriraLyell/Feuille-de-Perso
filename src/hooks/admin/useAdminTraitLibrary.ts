import { useState, useMemo, useCallback } from 'react';
import { RulesData } from '../../types/rules';
import { LibraryEntry, TraitEffect } from '../../types';
import { smartIncludes, normalizeString } from '../../utils/stringUtils';
import { publishFileToGitHub } from '../../services/githubService';
import { useAdminLibrary } from '../useAdminLibrary';
import { useNotification } from '../../context/NotificationContext';

interface UseAdminTraitLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

export type SortOption = 'name' | 'cost' | 'type';
export type SortOrder = 'asc' | 'desc';
export type AuditMode = 'incomplete' | 'complex' | 'popular' | 'unused' | 'duplicates' | null;

export const useAdminTraitLibrary = ({ rules, onUpdate, globalUsage = {} }: UseAdminTraitLibraryProps) => {
    const addLog = useNotification();
    
    // Core Admin Logic via Generic Hook
    const admin = useAdminLibrary<LibraryEntry, RulesData>({
        data: rules,
        onUpdate,
        addLog,
        collectionKey: 'libraries.traits',
        officialLibraryKey: 'traits',
        itemName: 'Trait',
        disableMerge: true // In Admin mode, we edit the source list directly
    });

    const library = admin.hybridList.map(m => m.entry);

    // Specific Filters
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [sourceFilter, setSourceFilter] = useState<boolean | null>(null);
    const [typeFilter, setTypeFilter] = useState<boolean | null>(null);

    const [filterEffects, setFilterEffects] = useState(false);
    const [filterCounter, setFilterCounter] = useState(false);
    const [filterXP, setFilterXP] = useState(false);
    const [filterVariants, setFilterVariants] = useState(false);
    const [auditMode, setAuditMode] = useState<AuditMode>(null);

    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // UI States for publishing (not in generic hook yet)
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showConfigAlert, setShowConfigAlert] = useState(false);

    const [tagInput, setTagInput] = useState('');

    // Compute derived data for the Form
    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];
        if (!rules.definitions.skills) return skills;
        Object.keys(rules.definitions.skills).forEach(cat => {
            rules.definitions.skills[cat].forEach(s => {
                if (s && s.trim() !== '') skills.push({ id: s, name: s });
            });
        });
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions.skills]);

    const allAttributes = useMemo(() => {
        const attrs: { id: string, name: string }[] = [];
        if (!rules.definitions.attributes) return attrs;
        Object.keys(rules.definitions.attributes).forEach(cat => {
            rules.definitions.attributes[cat].forEach(a => attrs.push({ id: a, name: a }));
            if (rules.configurations.global.secondaryAttributes && rules.definitions.secondaryAttributes?.[cat]) {
                rules.definitions.secondaryAttributes[cat].forEach(a => attrs.push({ id: a, name: a }));
            }
        });
        return attrs.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions.attributes, rules.configurations.global.secondaryAttributes, rules.definitions.secondaryAttributes]);

    const allCounters = useMemo(() => {
        const counters: { id: string, name: string }[] = [];
        if (!rules.definitions.counters) return counters;
        Object.values(rules.definitions.counters).forEach(c => {
            if (c.name && c.name.trim() !== '') counters.push({ id: c.id, name: c.name });
        });
        return counters.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions.counters]);

    const allFormulas = rules.libraries?.formulas || [];

    // Handlers
    const handleOpenNew = useCallback(() => {
        admin.handleOpenNew({
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
        setTagInput('');
    }, [admin, typeFilter]);

    const handleOpenEdit = useCallback((entry: LibraryEntry) => {
        admin.handleOpenEdit({ entry, source: 'local' }); // In Admin, treat as local to allow edit
        setTagInput('');
    }, [admin]);

    const handleSave = useCallback(() => {
        if (!admin.editingEntry) return;
        const entryToSave = { 
            ...admin.editingEntry, 
            effects: (admin.editingEntry.effects || []).map(e => ({ ...e, id: e.id || crypto.randomUUID() })) 
        };
        admin.handleSave(entryToSave);
    }, [admin]);

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
                meta: { version: rules.version, date: new Date().toISOString(), type: 'traits' },
                data: library
            }, null, 2);
            const result = await publishFileToGitHub(
                'public/data/traits.json',
                content,
                `update(traits): Mise à jour bibliothèque traits v${rules.version}`,
                { token, owner, repo, branch: 'main' }
            );
            if (result.success) setPublishResult({ success: true, message: "Bibliothèque de traits publiée avec succès !" });
            else setPublishResult({ success: false, message: "Erreur lors de la publication : " + result.message });
        } catch (e) {
            setPublishResult({ success: false, message: "Erreur inattendue : " + (e as Error).message });
        }
        setShowPublishConfirm(false);
    }, [library, rules.version]);

    // audit logic duplicate check
    const duplicateIds = useMemo(() => {
        const normalized = library.map((e: LibraryEntry) => ({ id: e.id, key: normalizeString(e.name).replace(/\s+/g, '') }));
        const seen = new Map<string, string>();
        const dupes = new Set<string>();
        normalized.forEach(({ id, key }) => {
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

    // Complex filtering logic
    const processedList = useMemo(() => {
        return library.filter(entry => {
            const entryTags = entry.tags || [];
            const matchesSearch = smartIncludes(entry.name, admin.searchTerm) ||
                smartIncludes(entry.description || "", admin.searchTerm) ||
                entryTags.some((t: string) => smartIncludes(t, admin.searchTerm));

            const matchesType = typeFilter === null || (typeFilter ? entry.type === 'avantage' : entry.type === 'desavantage');
            const matchesActive = activeFilter === null || (entry.isActive !== false) === activeFilter;
            const matchesSource = sourceFilter === null || (entry.isGlobal === true) === sourceFilter;
            const matchesTags = selectedTags.length === 0 || selectedTags.every((sel: string) =>
                entryTags.some((t: string) => t.toLowerCase() === sel.toLowerCase())
            );

            const matchesEffects = !filterEffects || (entry.effects && entry.effects.length > 0);
            const matchesCounter = !filterCounter || !!entry.hasAutoCounter;
            const matchesXP = !filterXP || !!entry.isXPUpgradeable;
            const matchesVariants = !filterVariants || (entry.variants && entry.variants.length > 0) || !!entry.isVariable || !!entry.is_variable;

            let matchesAudit = true;
            if (auditMode === 'incomplete') matchesAudit = !entry.description?.trim() || !entry.tags || entry.tags.length === 0;
            else if (auditMode === 'complex') matchesAudit = (entry.effects || []).some((e: TraitEffect) => e.type === 'formula');
            else if (auditMode === 'popular') matchesAudit = (globalUsage[entry.id] || 0) > 0;
            else if (auditMode === 'unused') matchesAudit = (globalUsage[entry.id] || 0) === 0;
            else if (auditMode === 'duplicates') matchesAudit = duplicateIds.has(entry.id);

            if (activeFilter === null && entry.isActive === false) return false;

            return matchesSearch && matchesType && matchesActive && matchesSource && matchesTags
                && matchesEffects && matchesCounter && matchesXP && matchesVariants && matchesAudit;
        }).sort((a, b) => {
            let comp = 0;
            if (sortBy === 'name') comp = a.name.localeCompare(b.name);
            else if (sortBy === 'cost') comp = (parseInt(a.cost || "0") || 0) - (parseInt(b.cost || "0") || 0);
            else if (sortBy === 'type') comp = a.type.localeCompare(b.type);
            if (comp === 0) return a.name.localeCompare(b.name);
            return sortOrder === 'asc' ? comp : -comp;
        });
    }, [library, admin.searchTerm, typeFilter, activeFilter, sourceFilter, selectedTags, sortBy, sortOrder,
        filterEffects, filterCounter, filterXP, filterVariants, auditMode, duplicateIds, globalUsage]);

    const allAvailableTags = useMemo(() => {
        const tags = new Set<string>();
        library.forEach(l => (l.tags || []).forEach((t: string) => tags.add(t)));
        return Array.from(tags).sort();
    }, [library]);

    // Form Sub-handlers
    const addTag = useCallback(() => {
        if (!admin.editingEntry || !tagInput.trim()) return;
        const newTag = tagInput.trim();
        if (!(admin.editingEntry.tags || []).includes(newTag)) {
            admin.setEditingEntry({ ...admin.editingEntry, tags: [...(admin.editingEntry.tags || []), newTag] });
        }
        setTagInput('');
    }, [admin, tagInput]);

    const removeTag = useCallback((t: string) => {
        if (!admin.editingEntry) return;
        admin.setEditingEntry({ ...admin.editingEntry, tags: (admin.editingEntry.tags || []).filter(tag => tag !== t) });
    }, [admin]);

    const addEffect = useCallback(() => {
        if (!admin.editingEntry) return;
        const newEffect: TraitEffect = { id: crypto.randomUUID(), type: 'formula', value: 0 };
        admin.setEditingEntry({ ...admin.editingEntry, effects: [...(admin.editingEntry.effects || []), newEffect] });
    }, [admin]);

    const updateEffect = useCallback((id: string, field: keyof TraitEffect, value: any) => {
        if (!admin.editingEntry) return;
        const updated = (admin.editingEntry.effects || []).map(e => e.id === id ? { ...e, [field]: value } : e);
        admin.setEditingEntry({ ...admin.editingEntry, effects: updated as TraitEffect[] });
    }, [admin]);

    const removeEffect = useCallback((id: string) => {
        if (!admin.editingEntry) return;
        admin.setEditingEntry({ ...admin.editingEntry, effects: (admin.editingEntry.effects || []).filter(e => e.id !== id) });
    }, [admin]);

    const handleBulkSelect = useCallback((active: boolean) => {
        const visibleIds = new Set(processedList.map(t => t.id));
        const newList = library.map(trait => visibleIds.has(trait.id) ? { ...trait, isActive: active } : trait);
        onUpdate({ ...rules, libraries: { ...rules.libraries, traits: newList } });
    }, [library, onUpdate, processedList, rules]);

    const handleToggleActive = useCallback((id: string) => {
        const newList = library.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t);
        onUpdate({ ...rules, libraries: { ...rules.libraries, traits: newList } });
    }, [library, onUpdate, rules]);

    return {
        // From Admin Hook
        searchTerm: admin.searchTerm, setSearchTerm: admin.setSearchTerm,
        isModalOpen: admin.isModalOpen, setIsModalOpen: admin.setIsModalOpen,
        editForm: admin.editingEntry, setEditForm: admin.setEditingEntry,
        error: admin.error,
        showDeleteConfirm: admin.entryToDelete?.id || null, setShowDeleteConfirm: (id: string | null) => admin.setEntryToDelete(id ? library.find(l => l.id === id) || null : null),
        confirmDelete: admin.executeDelete,
        
        // Own states
        selectedTags, setSelectedTags,
        activeFilter, setActiveFilter,
        sourceFilter, setSourceFilter,
        typeFilter, setTypeFilter,
        sortBy, setSortBy,
        sortOrder, setSortOrder,
        tagInput, setTagInput,
        showPublishConfirm, setShowPublishConfirm,
        publishResult, setPublishResult,
        showConfigAlert, setShowConfigAlert,
        filterEffects, setFilterEffects,
        filterCounter, setFilterCounter,
        filterXP, setFilterXP,
        filterVariants, setFilterVariants,
        auditMode, setAuditMode,

        // Data
        library,
        processedList,
        allAvailableTags,
        allSkills,
        allAttributes,
        allCounters,
        allFormulas,
        duplicateIds,

        // Handlers
        handleOpenNew,
        handleOpenEdit,
        handleDelete: (id: string) => admin.setEntryToDelete(library.find(l => l.id === id) || null),
        handleSave,
        handleBulkSelect,
        handleToggleActive,
        handlePublishClick,
        executePublish,
        addTag,
        removeTag,
        addEffect,
        updateEffect,
        removeEffect
    };
};
