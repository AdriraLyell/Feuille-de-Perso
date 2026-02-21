import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryBackgroundEntry } from '../../../types/system';
import { Search, Plus, Users, Save, AlertOctagon, Layers, CheckCircle2, Circle, Globe, Filter } from 'lucide-react';
import ThematicModal from '../../../components/ui/ThematicModal';
import TriStateChip from '../../../components/ui/TriStateChip';
import { useItemUsageDetails } from '../../../hooks/admin/useItemUsageDetails';
import { smartIncludes } from '../../../utils/stringUtils';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { BackgroundLibraryItem } from './background/BackgroundLibraryItem';

interface AdminBackgroundLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

const AdminBackgroundLibrary: React.FC<AdminBackgroundLibraryProps> = ({ rules, onUpdate, globalUsage = {} }) => {
    const list = rules.libraries.backgrounds;
    const { usageDetailsCache, loadDetails } = useItemUsageDetails('global', 'background');

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LibraryBackgroundEntry | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Advanced Filters
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [sourceFilter, setSourceFilter] = useState<boolean | null>(null);
    const [typeFilter, setTypeFilter] = useState<boolean | null>(null);

    const filteredList = useMemo(() => {
        return list
            .filter(b => {
                const matchesSearch = smartIncludes(b.name, searchTerm) || (b.description && smartIncludes(b.description, searchTerm));
                if (!matchesSearch) return false;

                if (activeFilter !== null) {
                    const isActive = b.isActive !== false;
                    if (activeFilter !== isActive) return false;
                }

                if (sourceFilter !== null) {
                    const isGlobal = b.isGlobal === true;
                    if (sourceFilter !== isGlobal) return false;
                }

                if (typeFilter !== null) {
                    const isVariable = b.isVariable === true;
                    if (typeFilter !== isVariable) return false;
                }

                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [list, searchTerm, activeFilter, sourceFilter, typeFilter]);

    const placedNames = useMemo(() => {
        const names = new Set<string>();
        const bgCat = rules.definitions.skillCategories?.find(c => c.behavior === 'Arrière-plan')?.id || 'Col_Comp_8';
        const placed = rules.definitions.skills?.[bgCat] || [];
        placed.forEach(name => {
            if (name.trim()) names.add(name.trim().toLowerCase());
        });
        return names;
    }, [rules.definitions]);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const handleOpenNew = () => {
        setError(null);
        setEditingItem({
            id: crypto.randomUUID(),
            name: '',
            description: '',
            isVariable: false
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: LibraryBackgroundEntry) => {
        setError(null);
        setEditingItem({ ...item });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setShowDeleteConfirm(id);
    };

    const confirmDelete = () => {
        if (!showDeleteConfirm) return;
        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, backgrounds: list.filter(b => b.id !== showDeleteConfirm) }
        });
        setShowDeleteConfirm(null);
    };

    const handleSave = () => {
        if (!editingItem) return;
        if (!editingItem.name.trim()) { setError("Le nom est requis."); return; }

        const duplicate = list.find(b => b.id !== editingItem.id && b.name.trim().toLowerCase() === editingItem.name.trim().toLowerCase());
        if (duplicate) { setError("Un historique portant ce nom existe déjà."); return; }

        const newList = list.some(b => b.id === editingItem.id)
            ? list.map(b => b.id === editingItem.id ? editingItem : b)
            : [...list, editingItem];

        // Sort
        newList.sort((a, b) => a.name.localeCompare(b.name));

        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, backgrounds: newList }
        });
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleBulkSelect = (active: boolean) => {
        const visibleIds = new Set(filteredList.map(item => item.id));
        const newList = list.map(item =>
            visibleIds.has(item.id) ? { ...item, isActive: active } : item
        );
        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, backgrounds: newList }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-120px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-purple-600" /> Bibliothèque d'Arrières-Plans
                    </h2>
                    <p className="text-slate-500 text-sm">Définissez les historiques disponibles (Alliés, Ressources, etc.).</p>
                </div>
                <div>
                    <button
                        onClick={handleOpenNew}
                        className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} /> Nouvel Historique
                    </button>
                </div>
            </div>

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:border-purple-500 outline-none"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap gap-2 items-center mb-4 p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center gap-1.5 px-2 text-slate-400 border-r border-slate-200 mr-1 py-1">
                    <Filter size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Filtres</span>
                </div>

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
                    label="Variable"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    icon={Layers}
                    activeColor="purple"
                />

                {(activeFilter !== null || sourceFilter !== null || typeFilter !== null) && (
                    <button
                        onClick={() => { setActiveFilter(null); setSourceFilter(null); setTypeFilter(null); }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 ml-auto px-2"
                    >
                        RESET
                    </button>
                )}
            </div>

            {/* Bulk Actions */}
            {list.length > 0 && (
                <div className="flex gap-4 mb-4 px-1">
                    <button
                        onClick={() => handleBulkSelect(true)}
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1.5 transition-colors"
                    >
                        <CheckCircle2 size={14} />
                        Tout activer {searchTerm ? `(${filteredList.length})` : ''}
                    </button>
                    <button
                        onClick={() => handleBulkSelect(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                        <Circle size={14} />
                        Tout désactiver {searchTerm ? `(${filteredList.length})` : ''}
                    </button>
                </div>
            )}

            <div className="flex-grow overflow-y-auto bg-slate-50 border border-slate-200 rounded p-4 custom-scrollbar">
                {list.length === 0 ? (
                    <div className="text-center text-slate-400 py-20 italic">Bibliothèque vide.</div>
                ) : filteredList.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 italic">Aucun résultat.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredList.map(item => {
                            const isPlaced = placedNames.has(item.name.trim().toLowerCase());
                            const isGloballyUsed = !!globalUsage[item.id];
                            const isLocked = isPlaced || isGloballyUsed;

                            return (
                                <BackgroundLibraryItem
                                    key={item.id}
                                    item={item}
                                    isPlaced={isPlaced}
                                    isLocked={isLocked}
                                    onToggleActive={(id: string, current: boolean) => {
                                        const newList = list.map(b => b.id === id ? { ...b, isActive: !current } : b);
                                        onUpdate({ ...rules, libraries: { ...rules.libraries, backgrounds: newList } });
                                    }}
                                    handleOpenEdit={handleOpenEdit}
                                    handleDelete={handleDelete}
                                    rules={rules}
                                    usageDetails={usageDetailsCache.get(item.id)}
                                    onLoadUsageDetails={loadDetails}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {isModalOpen && editingItem && (
                <ThematicModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingItem.id ? 'Modifier Historique' : 'Nouvel Historique'}
                    icon={<Users size={20} />}
                    size="md"
                    footer={
                        <>
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">Annuler</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-purple-600 text-white rounded font-bold shadow hover:bg-purple-700 flex items-center gap-2">
                                <Save size={16} /> Enregistrer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-5 py-2">
                        <div>
                            <label htmlFor="bg-name" className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
                            <input
                                id="bg-name"
                                className="w-full border border-slate-300 rounded px-3 py-2 font-bold focus:border-purple-500 outline-none"
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="bg-description" className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                            <textarea
                                id="bg-description"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm min-h-[100px] focus:border-purple-500 outline-none resize-none"
                                value={editingItem.description || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="bg-category" className="block text-xs font-bold text-slate-500 uppercase mb-1">Catégorie de Placement</label>
                            <select
                                id="bg-category"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none bg-white font-bold"
                                value={editingItem.defaultCategory || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, defaultCategory: e.target.value })}
                            >
                                <option value="">-- Par Défaut (Col 8) --</option>
                                {rules.definitions.skillCategories
                                    ?.filter(cat => cat.behavior === 'Arrière-plan')
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label} ({cat.id})</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded p-3 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isBgVariable"
                                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                                checked={editingItem.isVariable || false}
                                onChange={(e) => setEditingItem({ ...editingItem, isVariable: e.target.checked })}
                            />
                            <label htmlFor="isBgVariable" className="cursor-pointer select-none">
                                <span className="block text-sm font-bold text-purple-900">Variable / Spécification requise</span>
                                <span className="block text-xs text-purple-700">Ex: "Influence : Politique"</span>
                            </label>
                        </div>
                        {editingItem.isVariable && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200 -mt-3">
                                <label htmlFor="bg-variants" className="block text-xs font-bold text-slate-500 uppercase mb-1">Variantes suggérées (Réserve)</label>
                                <input
                                    id="bg-variants"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none font-bold placeholder:italic placeholder:font-normal"
                                    value={(editingItem.variants || []).join(', ')}
                                    onChange={(e) => setEditingItem({ ...editingItem, variants: e.target.value.split(',').map(v => v.trim()).filter(v => v !== '') })}
                                    placeholder="Noblesse, Milice, Académie..."
                                />
                                <p className="text-[10px] text-slate-500 mt-1 italic">Séparez les options par des virgules.</p>
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-50 text-red-800 text-xs p-3 rounded border border-red-200 font-bold flex items-center gap-2">
                                <AlertOctagon size={16} /> {error}
                            </div>
                        )}
                    </div>
                </ThematicModal>
            )}

            <ConfirmationModal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Supprimer l'historique ?"
                message="Cette action est irréversible pour la base de données."
                confirmLabel="Supprimer"
                type="danger"
            />
        </div>
    );
};

export default AdminBackgroundLibrary;
