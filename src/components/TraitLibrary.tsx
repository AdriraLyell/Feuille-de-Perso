
import React, { useState, useMemo } from 'react';
import { CharacterSheetData, LibraryEntry, TraitEffect } from '../types';
import { Search, Plus, BookOpen, Filter, Coins, Layers, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import TraitCard from './trait-library/TraitCard';
import TraitForm from './trait-library/TraitForm';
import { smartIncludes } from '../utils/stringUtils';

interface TraitLibraryProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onSelect?: (entry: LibraryEntry) => void;
    onMultiSelect?: (entries: LibraryEntry[]) => void;
    isEditable?: boolean;
    defaultFilter?: 'all' | 'avantage' | 'desavantage';
}

type SortOption = 'name' | 'cost' | 'type';
type SortOrder = 'asc' | 'desc';

const TraitLibrary: React.FC<TraitLibraryProps> = ({ data, onUpdate, onSelect, onMultiSelect, isEditable = true, defaultFilter = 'all' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'avantage' | 'desavantage'>(defaultFilter);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Sorting State
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Multi-select State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modal & Edit States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<LibraryEntry | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const library = data.library || [];

    // Toggle Selection for Multi-select
    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleConfirmMultiSelect = () => {
        if (onMultiSelect) {
            const selectedEntries = library.filter(l => selectedIds.includes(l.id));
            onMultiSelect(selectedEntries);
            setSelectedIds([]);
        }
    };

    // Gather all available skills and attributes for dropdowns
    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];
        Object.keys(data.skills).forEach(key => {
            // @ts-ignore
            data.skills[key].forEach(s => {
                if (s.name && s.name.trim() !== '') {
                    skills.push({ id: s.id, name: s.name });
                }
            });
        });
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.skills]);

    const allAttributes = useMemo(() => {
        const attrs: { id: string, name: string }[] = [];
        if (data.attributes) {
            Object.keys(data.attributes).forEach(key => {
                data.attributes[key].forEach(a => {
                    if (a.name && a.name.trim() !== '') {
                        attrs.push({ id: a.id, name: a.name });
                    }
                });
            });
        }
        return attrs.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.attributes]);

    const handleOpenNew = () => {
        setError(null);
        setTagInput('');
        setEditForm({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            type: filterType === 'all' ? 'avantage' : filterType,
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

    const handleDelete = (id: string) => {
        if (confirm('Supprimer ce trait de la bibliothèque ?')) {
            onUpdate({ ...data, library: library.filter(l => l.id !== id) });
        }
    };

    const handleSave = () => {
        if (!editForm) return;
        if (!editForm.name.trim()) { setError("Le nom du trait ne peut pas être vide."); return; }
        const duplicate = library.find(l => l.id !== editForm.id && l.name.trim().toLowerCase() === editForm.name.trim().toLowerCase());
        if (duplicate) { setError("Un trait portant ce nom existe déjà."); return; }

        const exists = library.some(l => l.id === editForm.id);
        const newLibrary = exists ? library.map(l => l.id === editForm.id ? editForm : l) : [editForm, ...library];

        onUpdate({ ...data, library: newLibrary });
        setIsModalOpen(false);
        setEditForm(null);
    };

    // --- Form Action Handlers ---
    const addTag = () => {
        if (!editForm || !tagInput.trim()) return;
        const newTag = tagInput.trim();
        if (!(editForm.tags || []).includes(newTag)) {
            setEditForm({ ...editForm, tags: [...(editForm.tags || []), newTag] });
        }
        setTagInput('');
    };

    const removeTag = (tagToRemove: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, tags: (editForm.tags || []).filter(t => t !== tagToRemove) });
    };

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

    // --- Filtering & Sorting Logic ---
    const toggleTagFilter = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

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

    const handleSortChange = (criteria: SortOption) => {
        if (sortBy === criteria) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(criteria); setSortOrder('asc'); }
    };

    const showFooter = !!onMultiSelect;

    return (
        <div className="flex flex-col h-full bg-white rounded shadow-sm border border-gray-200 overflow-hidden relative">
            {/* Header Toolbar */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-600" />
                        Bibliothèque de Traits
                    </h3>
                    {isEditable && (
                        <button onClick={handleOpenNew} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors shadow-sm">
                            <Plus size={16} /> Nouveau
                        </button>
                    )}
                </div>

                <div className="flex gap-2 items-center flex-wrap md:flex-nowrap">
                    <div className="relative flex-grow min-w-[150px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none text-gray-800 placeholder-gray-400 bg-white"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex bg-gray-200 rounded p-0.5 shrink-0">
                        {['all', 'avantage', 'desavantage'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t as any)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${filterType === t ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                {t === 'all' ? 'Tout' : t === 'avantage' ? 'Avantages' : 'Désavantages'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sorting Toolbar */}
                <div className="flex items-center gap-2 text-xs border-t border-gray-200 pt-2">
                    <span className="font-bold text-gray-500 uppercase tracking-wide">Trier par :</span>
                    <button onClick={() => handleSortChange('name')} className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${sortBy === 'name' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)} Nom
                    </button>
                    <button onClick={() => handleSortChange('cost')} className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${sortBy === 'cost' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <Coins size={14} /> Coût {sortBy === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button onClick={() => handleSortChange('type')} className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${sortBy === 'type' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <Layers size={14} /> Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                </div>

                {/* Tags Filter Bar */}
                {allAvailableTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <Filter size={14} className="text-gray-400 shrink-0" />
                        <div className="flex gap-1">
                            {allAvailableTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTagFilter(tag)}
                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap ${selectedTags.includes(tag) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        {selectedTags.length > 0 && (
                            <button onClick={() => setSelectedTags([])} className="text-[10px] text-red-500 hover:text-red-700 whitespace-nowrap px-1">Effacer filtres</button>
                        )}
                    </div>
                )}
            </div>

            {/* List Content */}
            <div className={`flex-grow overflow-y-auto p-0 min-h-0 ${showFooter ? 'pb-16' : ''}`}>
                {library.length === 0 && (
                    <div className="text-center text-gray-400 py-10 italic px-4 text-sm">
                        {isEditable ? "La bibliothèque est vide. Ajoutez des avantages et désavantages ici pour les réutiliser facilement." : "La bibliothèque est vide."}
                    </div>
                )}
                {library.length > 0 && processedList.length === 0 && (
                    <div className="text-center text-gray-400 py-10 italic px-4">Aucun trait ne correspond à votre recherche.</div>
                )}

                <div className="divide-y divide-gray-100">
                    {processedList.map(entry => (
                        <TraitCard
                            key={entry.id}
                            entry={entry}
                            isEditable={isEditable}
                            isSelected={selectedIds.includes(entry.id)}
                            onSelect={onSelect}
                            onMultiSelect={toggleSelection}
                            onEdit={handleOpenEdit}
                            onDelete={handleDelete}
                            showMultiSelect={!!onMultiSelect}
                        />
                    ))}
                </div>
            </div>

            {/* Multi-Select Footer */}
            {showFooter && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center z-20">
                    <span className="text-xs font-bold text-gray-600">{selectedIds.length} trait(s) sélectionné(s)</span>
                    <button
                        onClick={handleConfirmMultiSelect}
                        disabled={selectedIds.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Plus size={16} /> Ajouter la sélection
                    </button>
                </div>
            )}

            {/* EDIT MODAL */}
            {isModalOpen && editForm && (
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
            )}
        </div>
    );
};

export default TraitLibrary;
