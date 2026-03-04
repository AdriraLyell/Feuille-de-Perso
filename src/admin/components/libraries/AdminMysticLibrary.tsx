import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibrarySkillEntry } from '../../../types/system';
import { Search, Plus, Sparkles, Save, AlertOctagon, CheckCircle2, Circle, Globe, Filter, X } from 'lucide-react';
import ThematicModal from '../../../components/ui/ThematicModal';
import TriStateChip from '../../../components/ui/TriStateChip';
import { useItemUsageDetails } from '../../../hooks/admin/useItemUsageDetails';
import { smartIncludes } from '../../../utils/stringUtils';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { MysticLibraryItem } from './mystic/MysticLibraryItem';

interface AdminMysticLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

const AdminMysticLibrary: React.FC<AdminMysticLibraryProps> = ({ rules, onUpdate, globalUsage = {} }) => {
    const list = rules.libraries.mysticAbilities || [];
    const { usageDetailsCache, loadDetails } = useItemUsageDetails('global', 'mystic');

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LibrarySkillEntry | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [sourceFilter, setSourceFilter] = useState<boolean | null>(null);

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

                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [list, searchTerm, activeFilter, sourceFilter]);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const handleOpenNew = () => {
        setError(null);
        setEditingItem({
            id: crypto.randomUUID(),
            name: '',
            description: '',
            isActive: true,
            isGlobal: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: LibrarySkillEntry) => {
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
            libraries: { ...rules.libraries, mysticAbilities: list.filter(b => b.id !== showDeleteConfirm) }
        });
        setShowDeleteConfirm(null);
    };

    const handleSave = () => {
        if (!editingItem) return;
        const itemName = editingItem.name.trim();

        if (!itemName) { setError("Le nom est requis."); return; }

        const duplicate = list.find(b => b.id !== editingItem.id && b.name.trim().toLowerCase() === itemName.toLowerCase());
        if (duplicate) { setError("Une habilité portant ce nom existe déjà."); return; }

        const updatedAbility = {
            ...editingItem,
            name: itemName,
            defaultCategory: editingItem.defaultCategory || undefined
        };

        const newList = list.some(b => b.id === editingItem.id)
            ? list.map(b => b.id === editingItem.id ? updatedAbility : b)
            : [...list, updatedAbility];

        newList.sort((a, b) => a.name.localeCompare(b.name));

        // SYNC LOGIC: Auto-Manage associated Trait
        const currentTraits = rules.libraries.traits || [];
        // Find if a trait is already linked or matches name
        const targetTraitIndex = currentTraits.findIndex(t =>
            t.mysticAbilityId === editingItem.id ||
            (!t.mysticAbilityId && t.name.toLowerCase() === itemName.toLowerCase())
        );

        const newTraits = [...currentTraits];
        const traitBaseData = {
            name: itemName,
            type: 'avantage' as const,
            isVariableCost: true,
            cost: "1",
            pointsLabel: "1-5",
            description: editingItem.description || "Habilité mystique",
            mysticAbilityId: editingItem.id, // Ensure link
            isActive: editingItem.isActive,
            isGlobal: editingItem.isGlobal,
            tags: ['Mystique']
        };

        if (targetTraitIndex >= 0) {
            // Update existing
            newTraits[targetTraitIndex] = {
                ...newTraits[targetTraitIndex],
                ...traitBaseData
            };
        } else {
            // Create new
            newTraits.push({
                id: crypto.randomUUID(),
                ...traitBaseData
            });
        }

        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                mysticAbilities: newList,
                traits: newTraits
            }
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
            libraries: { ...rules.libraries, mysticAbilities: newList }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-120px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="text-amber-600" /> Bibliothèque des Habilités Mystiques
                    </h2>
                    <p className="text-slate-500 text-sm">Gérez les types d'habilités spéciales disponibles (Magie, Psy, Arts Martiaux...).</p>
                </div>
                <div>
                    <button
                        onClick={handleOpenNew}
                        className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} /> Nouvelle Habilité
                    </button>
                </div>
            </div>

            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={16} className="text-slate-400" />
                </span>
                <input
                    className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded focus:border-amber-500 outline-none"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
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

                {(activeFilter !== null || sourceFilter !== null) && (
                    <button
                        onClick={() => { setActiveFilter(null); setSourceFilter(null); }}
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
                        className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1.5 transition-colors"
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
                            const isLocked = !!globalUsage[item.id];

                            return (
                                <MysticLibraryItem
                                    key={item.id}
                                    item={item}
                                    isLocked={isLocked}
                                    onToggleActive={(id: string, current: boolean) => {
                                        const newList = list.map(b => b.id === id ? { ...b, isActive: !current } : b);
                                        onUpdate({ ...rules, libraries: { ...rules.libraries, mysticAbilities: newList } });
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
                    title={editingItem.id ? 'Modifier Habilité' : 'Nouvelle Habilité'}
                    icon={<Sparkles size={20} />}
                    size="md"
                    footer={
                        <>
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">Annuler</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-amber-600 text-white rounded font-bold shadow hover:bg-amber-700 flex items-center gap-2">
                                <Save size={16} /> Enregistrer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-5 py-2">
                        <div>
                            <label htmlFor="mystic-name" className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
                            <input
                                id="mystic-name"
                                className="w-full border border-slate-300 rounded px-3 py-2 font-bold focus:border-amber-500 outline-none"
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="mystic-description" className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                            <textarea
                                id="mystic-description"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm min-h-[100px] focus:border-amber-500 outline-none resize-none"
                                value={editingItem.description || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="mystic-category" className="block text-xs font-bold text-slate-500 uppercase mb-1">Catégorie de Placement</label>
                            <select
                                id="mystic-category"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none bg-white font-bold"
                                value={editingItem.defaultCategory || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, defaultCategory: e.target.value })}
                            >
                                <option value="">-- Par Défaut (Mystique) --</option>
                                {rules.definitions.skillCategories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label} ({cat.id})</option>
                                ))}
                            </select>
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
                title="Supprimer l'habilité ?"
                message="Cette action est irréversible pour la base de données."
                confirmLabel="Supprimer"
                type="danger"
            />
        </div>
    );
};

export default AdminMysticLibrary;
