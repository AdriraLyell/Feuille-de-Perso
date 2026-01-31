
import React, { useState, useMemo } from 'react';
import { CharacterSheetData, LibraryEntry, TraitEffect } from '../types';
import { useNotification } from '../context/NotificationContext';
import { Search, Plus, Trash2, Edit2, X, BookOpen, Filter, Tag as TagIcon, AlertCircle, Zap, Save, Check, AlignLeft, Hash, Star, GraduationCap, Dumbbell, ChevronDown, ArrowDownAZ, ArrowUpAZ, Coins, Layers, Square, CheckSquare } from 'lucide-react';

interface TraitLibraryProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onSelect?: (entry: LibraryEntry) => void;
    onMultiSelect?: (entries: LibraryEntry[]) => void; // New Prop for Multi-select
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
            setSelectedIds([]); // Reset after confirm
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

        if (!editForm.name.trim()) {
            setError("Le nom du trait ne peut pas être vide.");
            return;
        }

        const duplicate = library.find(l =>
            l.id !== editForm.id &&
            l.name.trim().toLowerCase() === editForm.name.trim().toLowerCase()
        );

        if (duplicate) {
            setError("Un trait portant ce nom existe déjà.");
            return;
        }

        const exists = library.some(l => l.id === editForm.id);
        let newLibrary;

        if (exists) {
            newLibrary = library.map(l => l.id === editForm.id ? editForm : l);
        } else {
            newLibrary = [editForm, ...library];
        }

        onUpdate({ ...data, library: newLibrary });
        setIsModalOpen(false);
        setEditForm(null);
    };

    // --- Form Handlers ---
    const addTag = () => {
        if (!editForm || !tagInput.trim()) return;
        // Keep case as typed by user (removed toLowerCase)
        const newTag = tagInput.trim();
        const currentTags = editForm.tags || [];
        if (!currentTags.includes(newTag)) {
            setEditForm({ ...editForm, tags: [...currentTags, newTag] });
        }
        setTagInput('');
    };

    const removeTag = (tagToRemove: string) => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            tags: (editForm.tags || []).filter(t => t !== tagToRemove)
        });
    };

    const addEffect = () => {
        if (!editForm) return;
        const newEffect: TraitEffect = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'xp_bonus',
            value: 0
        };
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
        setEditForm({
            ...editForm,
            effects: (editForm.effects || []).filter(e => e.id !== id)
        });
    };

    // --- Filtering & Sorting Logic ---

    const toggleTagFilter = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const getTags = (entry: LibraryEntry) => entry.tags || [];

    const processedList = useMemo(() => {
        let list = library.filter(entry => {
            const entryTags = getTags(entry);

            // Case insensitive search normalization
            const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entryTags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesType = filterType === 'all' || entry.type === filterType;

            // Case insensitive Tag Filter Check
            const matchesTags = selectedTags.length === 0 || selectedTags.every(sel =>
                entryTags.some(t => t.toLowerCase() === sel.toLowerCase())
            );

            return matchesSearch && matchesType && matchesTags;
        });

        // Sorting
        list.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === 'cost') {
                // Extract numeric value from cost string (e.g. "2 pts" -> 2)
                const valA = parseInt(a.cost) || 0;
                const valB = parseInt(b.cost) || 0;
                comparison = valA - valB;
            } else if (sortBy === 'type') {
                comparison = a.type.localeCompare(b.type);
            }

            // Secondary Sort: Always Alphabetical by Name if primary criteria is equal
            if (comparison === 0) {
                return a.name.localeCompare(b.name);
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return list;
    }, [library, searchTerm, filterType, selectedTags, sortBy, sortOrder]);

    const allAvailableTags = useMemo(() => {
        const tags = new Set<string>();
        library.forEach(l => getTags(l).forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [library]);

    const handleSortChange = (criteria: SortOption) => {
        if (sortBy === criteria) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(criteria);
            setSortOrder('asc');
        }
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

                    {/* Filter Buttons */}
                    <div className="flex bg-gray-200 rounded p-0.5 shrink-0">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${filterType === 'all' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Tout
                        </button>
                        <button
                            onClick={() => setFilterType('avantage')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${filterType === 'avantage' ? 'bg-white shadow text-green-700' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Avantages
                        </button>
                        <button
                            onClick={() => setFilterType('desavantage')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${filterType === 'desavantage' ? 'bg-white shadow text-red-700' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Désavantages
                        </button>
                    </div>
                </div>

                {/* Sorting Toolbar */}
                <div className="flex items-center gap-2 text-xs border-t border-gray-200 pt-2">
                    <span className="font-bold text-gray-500 uppercase tracking-wide">Trier par :</span>
                    <button
                        onClick={() => handleSortChange('name')}
                        className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${sortBy === 'name' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)}
                        Nom
                    </button>
                    <button
                        onClick={() => handleSortChange('cost')}
                        className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${sortBy === 'cost' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Coins size={14} /> Coût {sortBy === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSortChange('type')}
                        className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${sortBy === 'type' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
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
                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap ${selectedTags.includes(tag)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        {selectedTags.length > 0 && (
                            <button onClick={() => setSelectedTags([])} className="text-[10px] text-red-500 hover:text-red-700 whitespace-nowrap px-1">
                                Effacer filtres
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* List Content */}
            <div className={`flex-grow overflow-y-auto p-0 min-h-0 ${showFooter ? 'pb-16' : ''}`}>
                {library.length === 0 && (
                    <div className="text-center text-gray-400 py-10 italic px-4 text-sm">
                        {isEditable
                            ? "La bibliothèque est vide. Ajoutez des avantages et désavantages ici pour les réutiliser facilement."
                            : "La bibliothèque est vide. Pour ajouter des avantages ou désavantages, veuillez passer par le menu Configurer > Bibliothèque."
                        }
                    </div>
                )}

                {library.length > 0 && processedList.length === 0 && (
                    <div className="text-center text-gray-400 py-10 italic px-4">
                        Aucun trait ne correspond à votre recherche.
                    </div>
                )}

                <div className="divide-y divide-gray-100">
                    {processedList.map(entry => {
                        const isSelected = selectedIds.includes(entry.id);
                        return (
                            <div
                                key={entry.id}
                                className={`p-3 hover:bg-gray-50 transition-colors group cursor-pointer select-none ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                                onClick={() => {
                                    if (onMultiSelect) {
                                        toggleSelection(entry.id);
                                    } else if (onSelect) {
                                        onSelect(entry);
                                    }
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Multi-Select Checkbox */}
                                    {onMultiSelect && (
                                        <div className="mt-1 text-blue-600 shrink-0">
                                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
                                        </div>
                                    )}

                                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${entry.type === 'avantage' ? 'bg-green-500' : 'bg-red-500'}`} title={entry.type === 'avantage' ? 'Avantage' : 'Désavantage'} />

                                    <div className="flex-grow">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>{entry.name}</span>
                                                {/* Effect Indicator */}
                                                {entry.effects && entry.effects.length > 0 && (
                                                    <div title="Ce trait possède des effets mécaniques">
                                                        <Zap size={12} className="text-amber-500 fill-amber-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{entry.cost} pts</span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed mb-1.5">{entry.description || <span className="italic text-gray-300">Pas de description</span>}</p>

                                        {/* Display Tags */}
                                        {getTags(entry).length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {getTags(entry).map(tag => (
                                                    <span key={tag} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isEditable && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(entry); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Éditer">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Supprimer">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                        {onSelect && !onMultiSelect && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelect(entry); }}
                                                className="p-1.5 text-green-600 hover:bg-green-100 rounded border border-green-200 shadow-sm bg-white"
                                                title="Ajouter à la fiche"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Multi-Select Footer Action Bar */}
            {showFooter && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center z-20">
                    <span className="text-xs font-bold text-gray-600">
                        {selectedIds.length} trait(s) sélectionné(s)
                    </span>
                    <button
                        onClick={handleConfirmMultiSelect}
                        disabled={selectedIds.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Plus size={16} />
                        Ajouter la sélection
                    </button>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {isModalOpen && editForm && (
                <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className={`p-4 border-b flex justify-between items-center text-white ${editForm.type === 'avantage' ? 'bg-green-600' : 'bg-red-600'} transition-colors duration-300`}>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {editForm.id && library.some(l => l.id === editForm.id) ? <Edit2 size={20} /> : <Plus size={20} />}
                                {library.some(l => l.id === editForm.id) ? 'Éditer le Trait' : 'Nouveau Trait'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-6 bg-gray-50 flex flex-col gap-5">

                            {/* Type Switcher */}
                            <div className="flex justify-center">
                                <div className="bg-gray-200 p-1 rounded-lg flex shadow-inner">
                                    <button
                                        onClick={() => setEditForm({ ...editForm, type: 'avantage' })}
                                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${editForm.type === 'avantage' ? 'bg-white text-green-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Avantage
                                    </button>
                                    <button
                                        onClick={() => setEditForm({ ...editForm, type: 'desavantage' })}
                                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${editForm.type === 'desavantage' ? 'bg-white text-red-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Désavantage
                                    </button>
                                </div>
                            </div>

                            {/* Name & Cost */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nom du Trait</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-bold text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none placeholder-gray-400"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="Ex: Chance, Ennemi..."
                                        autoFocus
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Coût</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 bg-white"
                                        value={editForm.cost}
                                        onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                                        placeholder="Pt"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 flex items-center gap-1"><AlignLeft size={12} /> Description</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white min-h-[100px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y placeholder-gray-400"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Décrivez les effets narratifs ou les conditions d'utilisation..."
                                />
                            </div>

                            {/* Effects Section */}
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                                        <Zap size={16} className="text-amber-600 fill-amber-600" />
                                        Effets Mécaniques (Automatisés)
                                    </h5>
                                    <button
                                        onClick={addEffect}
                                        className="text-xs bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold transition-colors shadow-sm"
                                    >
                                        + Ajouter
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(!editForm.effects || editForm.effects.length === 0) && (
                                        <div className="text-center text-amber-800/40 text-xs italic py-2">
                                            Aucun effet configuré. Ce trait sera purement narratif.
                                        </div>
                                    )}
                                    {(editForm.effects || []).map(effect => {
                                        // Configuration visuelle par type
                                        let typeIcon = <Star size={16} />;
                                        let themeColor = 'text-amber-700';
                                        let borderColor = 'border-amber-200';
                                        let bgColor = 'bg-white';

                                        if (effect.type === 'xp_bonus') {
                                            typeIcon = <Star size={16} />;
                                            themeColor = 'text-amber-700';
                                            borderColor = 'border-amber-300';
                                            bgColor = 'bg-amber-50/50';
                                        } else if (effect.type === 'free_skill_rank') {
                                            typeIcon = <GraduationCap size={16} />;
                                            themeColor = 'text-blue-700';
                                            borderColor = 'border-blue-300';
                                            bgColor = 'bg-blue-50/50';
                                        } else if (effect.type === 'attribute_bonus') {
                                            typeIcon = <Dumbbell size={16} />;
                                            themeColor = 'text-rose-700';
                                            borderColor = 'border-rose-300';
                                            bgColor = 'bg-rose-50/50';
                                        }

                                        return (
                                            <div key={effect.id} className={`rounded-lg border ${borderColor} ${bgColor} shadow-sm overflow-hidden group`}>

                                                {/* Header Row: Type Selector & Delete */}
                                                <div className="flex items-center justify-between p-2 border-b border-black/5 bg-white/60">
                                                    <div className="flex items-center gap-2 flex-grow relative">
                                                        <div className={themeColor}>{typeIcon}</div>

                                                        {/* Styled Dropdown Container */}
                                                        <div className="relative flex-grow">
                                                            <select
                                                                className={`appearance-none bg-white border border-gray-300 font-bold text-xs text-gray-900 w-full focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer pr-4 py-1 pl-2 rounded shadow-sm`}
                                                                value={effect.type}
                                                                onChange={(e) => updateEffect(effect.id, 'type', e.target.value)}
                                                            >
                                                                <option value="attribute_bonus" className="text-gray-900 bg-white">Bonus Attribut</option>
                                                                <option value="xp_bonus" className="text-gray-900 bg-white">Bonus XP</option>
                                                                <option value="free_skill_rank" className="text-gray-900 bg-white">Rang de Compétence Gratuit</option>
                                                            </select>
                                                            <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${themeColor} opacity-50`} />
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeEffect(effect.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors ml-2">
                                                        <X size={14} />
                                                    </button>
                                                </div>

                                                {/* Content Row: Specific Inputs */}
                                                <div className="p-3">
                                                    {effect.type === 'xp_bonus' ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-gray-500">Montant XP :</span>
                                                            <input
                                                                type="number"
                                                                className="flex-grow border border-gray-300 rounded px-2 py-1 text-sm font-mono text-center focus:border-amber-500 outline-none"
                                                                placeholder="0"
                                                                value={effect.value}
                                                                onChange={(e) => updateEffect(effect.id, 'value', parseInt(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    ) : effect.type === 'free_skill_rank' ? (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="col-span-2">
                                                                <label className="block text-[10px] font-bold text-gray-400 mb-0.5 uppercase">Compétence Ciblée</label>
                                                                <div className="relative">
                                                                    <select
                                                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 appearance-none focus:border-blue-500 outline-none bg-white text-gray-900"
                                                                        value={effect.target || ''}
                                                                        onChange={(e) => updateEffect(effect.id, 'target', e.target.value)}
                                                                    >
                                                                        <option value="" className="text-gray-400">-- Choisir --</option>
                                                                        {allSkills.map(s => (
                                                                            <option key={s.id} value={s.name} className="text-gray-900 bg-white">{s.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-400 mb-0.5 uppercase">Rang Max</label>
                                                                <input
                                                                    type="number"
                                                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 text-center focus:border-blue-500 outline-none"
                                                                    value={effect.value}
                                                                    onChange={(e) => updateEffect(effect.id, 'value', parseInt(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="col-span-2">
                                                                <label className="block text-[10px] font-bold text-gray-400 mb-0.5 uppercase">Attribut Ciblé</label>
                                                                <div className="relative">
                                                                    <select
                                                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 appearance-none focus:border-rose-500 outline-none bg-white text-gray-900"
                                                                        value={effect.target || ''}
                                                                        onChange={(e) => updateEffect(effect.id, 'target', e.target.value)}
                                                                    >
                                                                        <option value="" className="text-gray-400">-- Choisir --</option>
                                                                        {allAttributes.map(a => (
                                                                            <option key={a.id} value={a.name} className="text-gray-900 bg-white">{a.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-400 mb-0.5 uppercase">Bonus (+)</label>
                                                                <input
                                                                    type="number"
                                                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 text-center focus:border-rose-500 outline-none"
                                                                    value={effect.value}
                                                                    onChange={(e) => updateEffect(effect.id, 'value', parseInt(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-bold animate-pulse">
                                    <AlertCircle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                className={`px-6 py-2 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105 ${editForm.type === 'avantage' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                <Save size={18} />
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TraitLibrary;
