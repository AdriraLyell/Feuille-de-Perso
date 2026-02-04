
import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryEntry, TraitEffect } from '../../../types';
import { Search, Plus, BookOpen, Filter, Coins, Layers, ArrowDownAZ, ArrowUpAZ, UploadCloud } from 'lucide-react';
import TraitCard from '../../../components/trait-library/TraitCard';
import TraitForm from '../../../components/trait-library/TraitForm';
import { smartIncludes } from '../../../utils/stringUtils';
import { publishFileToGitHub } from '../../../services/githubService';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

interface AdminTraitLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

type SortOption = 'name' | 'cost' | 'type';
type SortOrder = 'asc' | 'desc';

const AdminTraitLibrary: React.FC<AdminTraitLibraryProps> = ({ rules, onUpdate }) => {
    // Safe access to library
    const library = rules.libraries?.traits || [];

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'avantage' | 'desavantage'>('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            type: filterType === 'desavantage' ? 'desavantage' : 'avantage',
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

    const handlePublishClick = () => {
        const token = localStorage.getItem('GITHUB_TOKEN');
        const owner = localStorage.getItem('GITHUB_OWNER');
        const repo = localStorage.getItem('GITHUB_REPO');

        if (!token || !owner || !repo) {
            alert("Veuillez d'abord configurer vos identifiants GitHub via le bouton 'Publier' du menu principal.");
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
                alert("Bibliothèque de traits publiée avec succès !");
            } else {
                alert("Erreur lors de la publication : " + result.message);
            }
        } catch (e) {
            alert("Erreur inattendue : " + (e as Error).message);
        }
    };

    // Filter & Sort Logic
    const processedList = useMemo(() => {
        let list = library.filter(entry => {
            const entryTags = entry.tags || [];
            const matchesSearch = smartIncludes(entry.name, searchTerm) ||
                smartIncludes(entry.description, searchTerm) ||
                entryTags.some(t => smartIncludes(t, searchTerm));
            const matchesType = filterType === 'all' || entry.type === filterType;
            const matchesTags = selectedTags.length === 0 || selectedTags.every(sel =>
                entryTags.some(t => t.toLowerCase() === sel.toLowerCase())
            );
            return matchesSearch && matchesType && matchesTags;
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
    }, [library, searchTerm, filterType, selectedTags, sortBy, sortOrder]);

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
        const newEffect: TraitEffect = { id: Math.random().toString(36).substr(2, 9), type: 'xp_bonus', value: 0 };
        setEditForm({ ...editForm, effects: [...(editForm.effects || []), newEffect] });
    };

    const updateEffect = (id: string, field: keyof TraitEffect, value: any) => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            effects: (editForm.effects || []).map(e => e.id === id ? { ...e, [field]: value } : e)
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

            {/* Toolbar */}
            <div className="flex gap-4 items-center mb-4 p-3 bg-slate-50 rounded border border-slate-200">
                <div className="relative flex-grow max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:border-blue-500 outline-none"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-white rounded border border-slate-300 p-1">
                    {['all', 'avantage', 'desavantage'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t as any)}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${filterType === t ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            {t === 'all' ? 'Tout' : t === 'avantage' ? 'Avantages' : 'Désavantages'}
                        </button>
                    ))}

                </div>
                <div className="border-l border-slate-300 pl-4 flex gap-2">
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

            {/* List */}
            <div className="flex-grow overflow-y-auto bg-slate-50 border border-slate-200 rounded p-2">
                {library.length === 0 && <div className="text-center text-slate-400 py-20 italic">La bibliothèque est vide.</div>}

                <div className="space-y-1">
                    {processedList.map(entry => (
                        <TraitCard
                            key={entry.id}
                            entry={entry}
                            isEditable={true}
                            isSelected={false}
                            onSelect={() => { }} // No selection needed in Admin
                            onEdit={handleOpenEdit}
                            onDelete={handleDelete}
                            showMultiSelect={false}
                        />
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
        </div>
    );
};

export default AdminTraitLibrary;
