
import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryCounterEntry } from '../../../types/system';
import { Search, Plus, Save, AlertOctagon, Edit2, Trash2, Gauge, Hash, CheckCircle2, Circle, Lock, Globe } from 'lucide-react';
import ThematicModal from '../../../components/ui/ThematicModal';
import { smartIncludes } from '../../../utils/stringUtils';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

interface AdminCounterLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

const AdminCounterLibrary: React.FC<AdminCounterLibraryProps> = ({ rules, onUpdate, globalUsage = {} }) => {
    const list = rules.libraries.counters;

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LibraryCounterEntry | null>(null);
    const [error, setError] = useState<string | null>(null);

    const filteredList = useMemo(() => {
        return list
            .filter(c => smartIncludes(c.name, searchTerm) || (c.description && smartIncludes(c.description, searchTerm)))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [list, searchTerm]);

    const placedNames = useMemo(() => {
        const names = new Set<string>();
        const counterCat = rules.definitions.skillCategories?.find(c => c.behavior === 'Compteur')?.id || 'Col_Comp_9';
        const placed = rules.definitions.skills?.[counterCat] || [];
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
            maxValue: 10,
            defaultValue: 0,
            xpCost: 0,
            isGlobal: false
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: LibraryCounterEntry) => {
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
            libraries: { ...rules.libraries, counters: list.filter(c => c.id !== showDeleteConfirm) }
        });
        setShowDeleteConfirm(null);
    };

    const handleSave = () => {
        if (!editingItem) return;
        if (!editingItem.name.trim()) { setError("Le nom est requis."); return; }

        const duplicate = list.find(c => c.id !== editingItem.id && c.name.trim().toLowerCase() === editingItem.name.trim().toLowerCase());
        if (duplicate) { setError("Un compteur portant ce nom existe déjà."); return; }

        const safeItem = {
            ...editingItem,
            maxValue: Number(editingItem.maxValue) || 10,
            defaultValue: Number(editingItem.defaultValue) || 0,
            xpCost: Number(editingItem.xpCost) || 0
        };

        const newList = list.some(c => c.id === editingItem.id)
            ? list.map(c => c.id === editingItem.id ? safeItem : c)
            : [...list, safeItem];

        // Sort
        newList.sort((a, b) => a.name.localeCompare(b.name));

        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, counters: newList }
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
            libraries: { ...rules.libraries, counters: newList }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-180px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Gauge className="text-red-600" /> Bibliothèque de Compteurs
                    </h2>
                    <p className="text-slate-500 text-sm">Définissez les jauges (Santé, Volonté, Sang...).</p>
                </div>
                <div>
                    <button
                        onClick={handleOpenNew}
                        className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} /> Nouveau Compteur
                    </button>
                </div>
            </div>

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:border-red-500 outline-none"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Bulk Actions */}
            {list.length > 0 && (
                <div className="flex gap-4 mb-4 px-1">
                    <button
                        onClick={() => handleBulkSelect(true)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1.5 transition-colors"
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
                                <div key={item.id} className={`bg-white border rounded p-2 transition-shadow group ${item.isActive === false ? 'opacity-60 grayscale border-slate-200' : 'hover:shadow-md border-slate-300'}`}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {/* 1. Toggle */}
                                        <div className="w-8 flex justify-center shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={item.isActive !== false}
                                                onChange={() => {
                                                    const newList = list.map(c => c.id === item.id ? { ...c, isActive: !c.isActive } : c);
                                                    onUpdate({ ...rules, libraries: { ...rules.libraries, counters: newList } });
                                                }}
                                                className="w-4 h-4 text-red-600 rounded cursor-pointer"
                                                title={item.isActive !== false ? "Désactiver" : "Activer"}
                                            />
                                        </div>

                                        {/* 2. Status Icons */}
                                        <div className="w-16 flex items-center gap-1 shrink-0">
                                            {item.isGlobal && <div title="Item Global"><Globe size={14} className="text-indigo-500" /></div>}
                                            {isLocked && (
                                                <div className="text-amber-600" title={isPlaced ? "Utilisé dans cette campagne" : "Utilisé dans d'autres campagnes"}>
                                                    <Lock size={14} />
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. Content */}
                                        <div className="flex-grow overflow-hidden pr-2">
                                            <div className={`font-bold truncate text-sm ${item.isActive === false ? 'text-slate-500 line-through' : 'text-slate-800'}`} title={item.name}>
                                                {item.name}
                                            </div>
                                        </div>

                                        {/* 4. Actions */}
                                        <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={isLocked}
                                                className={`p-1 rounded ${isLocked ? 'text-slate-300' : 'text-red-500 hover:bg-red-50'}`}
                                                title={isLocked ? "Suppression bloquée : utilisé" : "Supprimer définitivement"}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ml-10"> {/* Aligned with name content start */}
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 bg-slate-50 p-1 rounded border border-slate-100 mb-1">
                                            <span title="Valeur Max" className="flex items-center gap-1"><Hash size={10} />Max: {item.maxValue}</span>
                                            <span title="Défaut">Départ: {item.defaultValue}</span>
                                            <span title="Coût XP">Coût: {item.xpCost}</span>
                                        </div>
                                        {item.description && <p className="text-[10px] text-slate-500 italic line-clamp-1">{item.description}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isModalOpen && editingItem && (
                <ThematicModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingItem.id ? 'Modifier Compteur' : 'Nouveau Compteur'}
                    icon={<Gauge size={20} />}
                    size="md"
                    footer={
                        <>
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">Annuler</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-red-600 text-white rounded font-bold shadow hover:bg-red-700 flex items-center gap-2">
                                <Save size={16} /> Enregistrer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4 py-2">
                        <div>
                            <label htmlFor="counter-name" className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
                            <input
                                id="counter-name"
                                className="w-full border border-slate-300 rounded px-3 py-2 font-bold focus:border-red-500 outline-none"
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label htmlFor="counter-description" className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Notes)</label>
                            <textarea
                                id="counter-description"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm min-h-[60px] focus:border-red-500 outline-none resize-none"
                                value={editingItem.description || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                placeholder="Expliquez à quoi sert ce compteur..."
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="counter-max" className="block text-xs font-bold text-slate-500 uppercase mb-1">Max (Cases)</label>
                                <input
                                    id="counter-max"
                                    type="number"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
                                    value={editingItem.maxValue}
                                    onChange={(e) => setEditingItem({ ...editingItem, maxValue: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label htmlFor="counter-default" className="block text-xs font-bold text-slate-500 uppercase mb-1">Défaut (Rempli)</label>
                                <input
                                    id="counter-default"
                                    type="number"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
                                    value={editingItem.defaultValue}
                                    onChange={(e) => setEditingItem({ ...editingItem, defaultValue: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label htmlFor="counter-xp-cost" className="block text-xs font-bold text-slate-500 uppercase mb-1">Coût XP</label>
                                <input
                                    id="counter-xp-cost"
                                    type="number"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
                                    value={editingItem.xpCost}
                                    onChange={(e) => setEditingItem({ ...editingItem, xpCost: Number(e.target.value) })}
                                />
                            </div>
                        </div>

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
                title="Supprimer le compteur ?"
                message="Cette action est irréversible pour la base de données."
                confirmLabel="Supprimer"
                type="danger"
            />
        </div>
    );
};

export default AdminCounterLibrary;
