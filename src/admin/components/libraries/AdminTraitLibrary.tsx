
import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryEntry, TraitEffect } from '../../../types';
import { Search, Plus, BookOpen, Filter, Coins, Layers, ArrowDownAZ, ArrowUpAZ, UploadCloud, CheckCircle2, Circle, Globe, X } from 'lucide-react';
import TraitCard from '../../../components/trait-library/TraitCard';
import TraitForm from '../../../components/trait-library/TraitForm';
import TriStateChip from '../../../components/ui/TriStateChip';
import { smartIncludes } from '../../../utils/stringUtils';
import { publishFileToGitHub } from '../../../services/githubService';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

interface AdminTraitLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

type SortOption = 'name' | 'cost' | 'type';
type SortOrder = 'asc' | 'desc';

const AdminTraitLibrary: React.FC<AdminTraitLibraryProps> = ({ rules, onUpdate, globalUsage = {} }) => {
    // Safe access to library
    const library = rules.libraries?.traits || [];

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Advanced Filters
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [sourceFilter, setSourceFilter] = useState<boolean | null>(null);
    const [typeFilter, setTypeFilter] = useState<boolean | null>(null); // true = Avantage, false = Desavantage

    // Sorting
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // UI States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<LibraryEntry | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Compute derived data for the Form (Skills & Attributes) from Rules
    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];
        Object.keys(rules.definitions.skills).forEach(cat => {
            rules.definitions.skills[cat].forEach(s => {
                if (s && s.trim() !== '') {
                    // Use name as ID for rules-based skills (simplified) or generate ID if needed
                    // For referencing, the name is usually key. 
                    // But TraitForm might expect ID. We'll use name as ID.
                    skills.push({ id: s, name: s });
                }
            });
        });
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions.skills]);

    const allAttributes = useMemo(() => {
        const attrs: { id: string, name: string }[] = [];
        Object.keys(rules.definitions.attributes).forEach(cat => {
            rules.definitions.attributes[cat].forEach(a => {
                attrs.push({ id: a, name: a });
            });
            // Also secondary?
            if (rules.configurations.global.secondaryAttributes && rules.definitions.secondaryAttributes[cat]) {
                rules.definitions.secondaryAttributes[cat].forEach(a => {
                    attrs.push({ id: a, name: a });
                });
            }
        });
        return attrs.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions.attributes, rules.configurations.global.secondaryAttributes]);

    // Helpers
    const handleOpenNew = () => {
        setError(null);
        setTagInput('');
        setEditForm({
            id: crypto.randomUUID(),
            name: '',
            type: typeFilter === false ? 'desavantage' : 'avantage',
            cost: '1',
            description: '',
            tags: [],
            effects: []
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (entry: LibraryEntry) => {
        setError(null);
        setTagInput('');
        setEditForm({
            ...entry,
            tags: [...(entry.tags || [])],
            effects: (entry.effects || []).map(e => ({ ...e }))
        });
        setIsModalOpen(true);
    };

    // Modals State
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showConfigAlert, setShowConfigAlert] = useState(false);

    const handleDelete = (id: string) => {
        setShowDeleteConfirm(id);
    };

    const confirmDelete = () => {
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
    };

    const handleSave = () => {
        if (!editForm) return;
        if (!editForm.name.trim()) { setError("Le nom est requis."); return; }

        const duplicate = library.find(l => l.id !== editForm.id && l.name.trim().toLowerCase() === editForm.name.trim().toLowerCase());
        if (duplicate) { setError("Un trait avec ce nom existe déjà."); return; }

        const exists = library.some(l => l.id === editForm.id);
        const newLibrary = exists
            ? library.map(l => l.id === editForm.id ? editForm : l)
            : [editForm, ...library];

        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                traits: newLibrary
            }
        });
        setIsModalOpen(false);
        setEditForm(null);
    };

    const handleBulkSelect = (active: boolean) => {
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
    };

    // Filter & Sort Logic
    const processedList = useMemo(() => {
        let list = library.filter(entry => {
            const entryTags = entry.tags || [];
            const matchesSearch = smartIncludes(entry.name, searchTerm) ||
                smartIncludes(entry.description, searchTerm) ||
                entryTags.some(t => smartIncludes(t, searchTerm));

            const matchesType = typeFilter === null || (typeFilter ? entry.type === 'avantage' : entry.type === 'desavantage');
            const matchesActive = activeFilter === null || (entry.isActive !== false) === activeFilter;
            const matchesSource = sourceFilter === null || (entry.isGlobal === true) === sourceFilter;

            const matchesTags = selectedTags.length === 0 || selectedTags.every(sel =>
                entryTags.some(t => t.toLowerCase() === sel.toLowerCase())
            );
            return matchesSearch && matchesType && matchesActive && matchesSource && matchesTags;
        });

        list.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
            else if (sortBy === 'cost') comparison = (parseInt(a.cost) || 0) - (parseInt(b.cost) || 0);
            else if (sortBy === 'type') comparison = a.type.localeCompare(b.type);

            if (comparison === 0) return a.name.localeCompare(b.name);
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return list;
    }, [library, searchTerm, typeFilter, activeFilter, sourceFilter, selectedTags, sortBy, sortOrder]);

    const allAvailableTags = useMemo(() => {
        const tags = new Set<string>();
        library.forEach(l => (l.tags || []).forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [library]);

    // Form Manipulation Wrappers (Passed to TraitForm)
    const addTag = () => {
        if (!editForm || !tagInput.trim()) return;
        const newTag = tagInput.trim();
        if (!(editForm.tags || []).includes(newTag)) {
            setEditForm({ ...editForm, tags: [...(editForm.tags || []), newTag] });
        }
        setTagInput('');
    };
    const removeTag = (t: string) => editForm && setEditForm({ ...editForm, tags: (editForm.tags || []).filter(tag => tag !== t) });

    // Effects manipulation
    const addEffect = () => {
        if (!editForm) return;
        const newEffect: TraitEffect = { id: crypto.randomUUID(), type: 'xp_bonus', value: 0 };
        setEditForm({ ...editForm, effects: [...(editForm.effects || []), newEffect] });
    };

    const updateEffect = <K extends keyof TraitEffect>(
        id: string,
        field: K,
        value: TraitEffect[K]
    ) => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            effects: (editForm.effects || []).map(e => e.id === id ? { ...e, [field]: value } as TraitEffect : e)
        });
    };

    const removeEffect = (id: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, effects: (editForm.effects || []).filter(e => e.id !== id) });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-180px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="text-blue-600" /> Bibliothèque de Traits Officiels
                    </h2>
                    <p className="text-slate-500 text-sm">Gérez ici les Avantages et Défauts qui seront proposés aux joueurs.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePublishClick}
                        className="bg-purple-700 text-white px-3 py-2 rounded font-bold hover:bg-purple-800 transition-colors flex items-center gap-2 text-sm"
                        title="Publier traits.json"
                    >
                        <UploadCloud size={16} /> Publier JSON
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} /> Nouveau Trait
                    </button>
                </div>
            </div>

            {/* Toolbar & Filters */}
            <div className="flex flex-wrap gap-4 items-center mb-4 p-3 bg-slate-50 rounded border border-slate-200">
                <div className="relative flex-grow max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:border-blue-500 outline-none"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <TriStateChip
                        label="Actifs"
                        value={activeFilter}
                        onChange={setActiveFilter}
                        icon={CheckCircle2}
                        activeColor="green"
                    />

                    <TriStateChip
                        label="Officiels"
                        value={sourceFilter}
                        onChange={setSourceFilter}
                        icon={Globe}
                        activeColor="indigo"
                    />

                    <TriStateChip
                        label="Avantages"
                        value={typeFilter}
                        onChange={setTypeFilter}
                        icon={Layers}
                        activeColor="blue"
                    />

                    {(activeFilter !== null || sourceFilter !== null || typeFilter !== null) && (
                        <button
                            onClick={() => { setActiveFilter(null); setSourceFilter(null); setTypeFilter(null); }}
                            className="text-[10px] font-bold text-red-500 hover:text-red-700 ml-2"
                        >
                            RESET
                        </button>
                    )}
                </div>

                <div className="ml-auto flex gap-2 border-l border-slate-300 pl-4">
                    <button onClick={() => { setSortBy('name'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }} className={`p-2 rounded border ${sortBy === 'name' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-600'}`}>
                        {sortBy === 'name' && sortOrder === 'asc' ? <ArrowDownAZ size={16} /> : <ArrowUpAZ size={16} />}
                    </button>
                    <button onClick={() => { setSortBy('cost'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }} className={`p-2 rounded border ${sortBy === 'cost' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-600'}`}>
                        <Coins size={16} />
                    </button>
                </div>
            </div>

            {/* Tag Filter */}
            {
                allAvailableTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 items-center pl-1">
                        <Filter size={14} className="text-slate-400" />
                        {allAvailableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${selectedTags.includes(tag) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                            >
                                {tag}
                            </button>
                        ))}
                        {selectedTags.length > 0 && <button onClick={() => setSelectedTags([])} className="text-xs text-red-500 hover:underline">Effacer</button>}
                    </div>
                )
            }

            {/* Bulk Actions */}
            {library.length > 0 && (
                <div className="flex gap-4 mb-4 px-1">
                    <button
                        onClick={() => handleBulkSelect(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                    >
                        <CheckCircle2 size={14} />
                        Tout activer {searchTerm ? `(${processedList.length})` : ''}
                    </button>
                    <button
                        onClick={() => handleBulkSelect(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                        <Circle size={14} />
                        Tout désactiver {searchTerm ? `(${processedList.length})` : ''}
                    </button>
                </div>
            )}

            {/* List */}
            <div className="flex-grow overflow-y-auto bg-slate-50 border border-slate-200 rounded p-2">
                {library.length === 0 && <div className="text-center text-slate-400 py-20 italic">La bibliothèque est vide.</div>}

                <div className="space-y-1">
                    {processedList.map(entry => (
                        <div key={entry.id} className="relative group">
                            <div className="flex items-center gap-1 group">
                                {/* 1. Toggle (Fixed width) */}
                                <div className="w-8 flex justify-center shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={entry.isActive !== false}
                                        onChange={() => {
                                            const newList = library.map(t => t.id === entry.id ? { ...t, isActive: !t.isActive } : t);
                                            onUpdate({
                                                ...rules,
                                                libraries: {
                                                    ...rules.libraries,
                                                    traits: newList
                                                }
                                            });
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                        title={entry.isActive !== false ? "Désactiver (Retirer de la campagne)" : "Activer (Ajouter à la campagne)"}
                                    />
                                </div>

                                <div className="flex-grow">
                                    <TraitCard
                                        entry={entry}
                                        isEditable={true}
                                        isSelected={false}
                                        isActive={entry.isActive !== false}
                                        onEdit={handleOpenEdit}
                                        onDelete={handleDelete}
                                        showMultiSelect={false}
                                        source={entry.isGlobal ? 'official' : 'local'}
                                        isLocked={!!globalUsage[entry.id]}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal - Reusing the Player Component */}
            {
                isModalOpen && editForm && (
                    <TraitForm
                        editForm={editForm}
                        library={library}
                        allSkills={allSkills}
                        allAttributes={allAttributes}
                        tagInput={tagInput}
                        error={error}
                        setEditForm={setEditForm}
                        setTagInput={setTagInput}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        addTag={addTag}
                        removeTag={removeTag}
                        addEffect={addEffect}
                        updateEffect={updateEffect}
                        removeEffect={removeEffect}
                    />
                )
            }

            <ConfirmationModal
                isOpen={showPublishConfirm}
                onClose={() => setShowPublishConfirm(false)}
                onConfirm={executePublish}
                title="Publier les traits ?"
                message="Vous allez mettre à jour le fichier traits.json public. Cela affectera tous les joueurs lors de leur prochaine mise à jour."
                confirmLabel="Publier"
                type="warning"
            />

            <ConfirmationModal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Supprimer le trait ?"
                message="Cette action supprimera définitivement le trait de la base admin."
                confirmLabel="Supprimer"
                type="danger"
            />

            <ConfirmationModal
                isOpen={!!publishResult}
                onClose={() => setPublishResult(null)}
                onConfirm={() => setPublishResult(null)}
                title={publishResult?.success ? "Publication Réussie" : "Échec de la Publication"}
                message={publishResult?.message || ""}
                confirmLabel="Fermer"
                type={publishResult?.success ? "success" : "danger"}
                cancelLabel=""
            />

            <ConfirmationModal
                isOpen={showConfigAlert}
                onClose={() => setShowConfigAlert(false)}
                onConfirm={() => setShowConfigAlert(false)}
                title="Configuration Manquante"
                message="Veuillez d'abord configurer vos identifiants GitHub via le bouton 'Publier' du menu principal."
                confirmLabel="Compris"
                type="info"
                cancelLabel=""
            />
        </div>
    );
};

export default AdminTraitLibrary;
