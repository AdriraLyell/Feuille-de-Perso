
import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryBackgroundEntry } from '../../../types/system'; // Ensure this type is exported from where it was defined (src/types/system.ts)
import { Search, Plus, Users, Save, AlertOctagon, Edit2, Trash2, Layers } from 'lucide-react';
import ThematicModal from '../../../components/ui/ThematicModal';
import { smartIncludes } from '../../../utils/stringUtils';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

interface AdminBackgroundLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminBackgroundLibrary: React.FC<AdminBackgroundLibraryProps> = ({ rules, onUpdate }) => {
    // @ts-ignore - types might need strict alignment, but runtime is safe if shape matches
    const list: LibraryBackgroundEntry[] = rules.libraries?.backgrounds || [];

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LibraryBackgroundEntry | null>(null);
    const [error, setError] = useState<string | null>(null);

    const filteredList = useMemo(() => {
        return list
            .filter(b => smartIncludes(b.name, searchTerm) || (b.description && smartIncludes(b.description, searchTerm)))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [list, searchTerm]);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const handleOpenNew = () => {
        setError(null);
        setEditingItem({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            description: '',
            isVariable: false,
            // defaultCategory is not relevant for Backgrounds usually, or fixed to 'arrieres_plans'
            defaultCategory: 'arrieres_plans'
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
            // @ts-ignore
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
            // @ts-ignore
            libraries: { ...rules.libraries, backgrounds: newList }
        });
        setIsModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-180px)] flex flex-col">
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

            <div className="flex-grow overflow-y-auto bg-slate-50 border border-slate-200 rounded p-4 custom-scrollbar">
                {list.length === 0 ? (
                    <div className="text-center text-slate-400 py-20 italic">Bibliothèque vide.</div>
                ) : filteredList.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 italic">Aucun résultat.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredList.map(item => (
                            <div key={item.id} className={`bg-white border rounded p-3 transition-shadow group flex flex-col justify-between ${item.isActive === false ? 'opacity-60 grayscale border-slate-200' : 'hover:shadow-md border-slate-300'}`}>
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <input
                                                type="checkbox"
                                                checked={item.isActive !== false}
                                                onChange={() => {
                                                    const newList = list.map(b => b.id === item.id ? { ...b, isActive: !b.isActive } : b);
                                                    // @ts-ignore
                                                    onUpdate({ ...rules, libraries: { ...rules.libraries, backgrounds: newList } });
                                                }}
                                                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                                                title={item.isActive !== false ? "Désactiver" : "Activer"}
                                            />
                                            {item.isVariable && <span title="Variable"><Layers size={14} className="text-purple-500 shrink-0" /></span>}
                                            <span className={`font-bold truncate ${item.isActive === false ? 'text-slate-500 line-through' : 'text-slate-800'}`} title={item.name}>{item.name}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                            <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                            {item.isGlobal && <span title="Global" className="text-xs text-amber-500 font-bold border border-amber-200 bg-amber-50 px-1 rounded">GLOBAL</span>}
                                        </div>
                                    </div>
                                    {item.description && <p className="text-xs text-slate-500 italic line-clamp-2 mb-2">{item.description}</p>}
                                </div>
                            </div>
                        ))}
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
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
                            <input
                                className="w-full border border-slate-300 rounded px-3 py-2 font-bold focus:border-purple-500 outline-none"
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                            <textarea
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm min-h-[100px] focus:border-purple-500 outline-none resize-none"
                                value={editingItem.description || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            />
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded p-3 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isBgVariable"
                                className="w-4 h-4 text-purple-600 rounded"
                                checked={editingItem.isVariable || false}
                                onChange={(e) => setEditingItem({ ...editingItem, isVariable: e.target.checked })}
                            />
                            <label htmlFor="isBgVariable" className="cursor-pointer select-none">
                                <span className="block text-sm font-bold text-purple-900">Variable / Spécification requise</span>
                                <span className="block text-xs text-purple-700">Ex: "Influence : Politique"</span>
                            </label>
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
                title="Supprimer l'historique ?"
                message="Cette action est irréversible pour la base de données."
                confirmLabel="Supprimer"
                type="danger"
            />
        </div>
    );
};

export default AdminBackgroundLibrary;
