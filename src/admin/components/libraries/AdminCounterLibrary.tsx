import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryCounterEntry } from '../../../types/system';
import { Search, Plus, Save, AlertOctagon, Gauge, CheckCircle2, Circle, X, Calculator } from 'lucide-react';
import ThematicModal from '../../../components/ui/ThematicModal';
import { useItemUsageDetails } from '../../../hooks/admin/useItemUsageDetails';
import { smartIncludes } from '../../../utils/stringUtils';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { CounterLibraryItem } from './counter/CounterLibraryItem';

interface AdminCounterLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

const AdminCounterLibrary: React.FC<AdminCounterLibraryProps> = ({ rules, onUpdate, globalUsage = {} }) => {
    const list = rules.libraries.counters;
    const { usageDetailsCache, loadDetails } = useItemUsageDetails('global', 'counter');

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

    // STATIC UUIDS for system counters to satisfy DB constraints while keeping IDs stable
    const VOLONTE_UUID = 'c0000000-0000-0000-0000-000000000001';
    const CONFIANCE_UUID = 'c0000000-0000-0000-0000-000000000002';

    const handleCleanDuplicates = () => {
        const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const seenNames = new Map<string, string>(); // name -> preferredId
        const toDelete = new Set<string>();
        
        // Phase 1: Identify system counters and map their names to the official UUIDs
        list.forEach(item => {
            const normName = normalize(item.name);
            if (normName === 'volonte') seenNames.set(normName, VOLONTE_UUID);
            else if (normName === 'confiance') seenNames.set(normName, CONFIANCE_UUID);
        });

        // Phase 2: Identify duplicates and invalid IDs
        const cleanedList = list.filter(item => {
            const normName = normalize(item.name);
            const preferredId = seenNames.get(normName);
            
            // If it's a system counter but has a different ID, it's a duplicate or invalid ID
            if (preferredId && item.id !== preferredId) {
                toDelete.add(item.id);
                return false;
            }
            
            // Catch entries with non-UUID IDs (like 'volonte' string) that might be in the state but fail DB sync
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(item.id) && !item.id.startsWith('c0000000')) {
                toDelete.add(item.id);
                return false;
            }

            return true;
        });

        // Phase 3: Add official system counters if they were missing or replaced
        seenNames.forEach((id, name) => {
            if (!cleanedList.some(c => c.id === id)) {
                const original = list.find(c => normalize(c.name) === name);
                cleanedList.push({
                    id,
                    name: name === 'volonte' ? 'Volonté' : 'Confiance',
                    description: original?.description || '',
                    maxValue: original?.maxValue || 10,
                    defaultValue: original?.defaultValue || 0,
                    xpCost: original?.xpCost || 5,
                    isActive: true
                });
            }
        });

        if (toDelete.size > 0) {
            onUpdate({
                ...rules,
                libraries: { ...rules.libraries, counters: cleanedList }
            });
        }
    };


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

        const counterToDelete = list.find(c => c.id === showDeleteConfirm);
        const newDefinitionsCounters = { ...(rules.definitions.counters || {}) };

        if (counterToDelete) {
            const key = counterToDelete.id === VOLONTE_UUID ? 'volonte' : (counterToDelete.id === CONFIANCE_UUID ? 'confiance' : counterToDelete.id || counterToDelete.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''));
            delete newDefinitionsCounters[key];
        }

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                counters: newDefinitionsCounters
            },
            libraries: { ...rules.libraries, counters: list.filter(c => c.id !== showDeleteConfirm) }
        });
        setShowDeleteConfirm(null);
    };

    const handleSave = () => {
        if (!editingItem) return;
        if (!editingItem.name.trim()) { setError("Le nom est requis."); return; }

        const duplicate = list.find(c => c.id !== editingItem.id && c.name.trim().toLowerCase() === editingItem.name.trim().toLowerCase());
        if (duplicate) { setError("Un compteur portant ce nom existe déjà."); return; }

        const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const normName = normalize(editingItem.name);

        let finalId = editingItem.id;
        if (normName === 'volonte') finalId = VOLONTE_UUID;
        else if (normName === 'confiance') finalId = CONFIANCE_UUID;

        const safeItem = {
            ...editingItem,
            id: finalId,
            maxValue: Number(editingItem.maxValue) || 10,
            defaultValue: Number(editingItem.defaultValue) || 0,
            xpCost: Number(editingItem.xpCost) || 0,
            appearance: (editingItem.appearance === 'squares_only' ? 'squares_only' : null) as 'squares_only' | null
        };

        const newList = list.some(c => c.id === safeItem.id)
            ? list.map(c => c.id === safeItem.id ? safeItem : c)
            : [...list, safeItem];

        // Sort
        newList.sort((a, b) => a.name.localeCompare(b.name));

        // Update definitions as well so it's ready to be saved correctly to the DB
        const newDefinitionsCounters = { ...(rules.definitions.counters || {}) };

        // key format as in campaignReconciler.ts (using stable UUIDs for system keys)
        const key = safeItem.id === VOLONTE_UUID ? 'volonte' : (safeItem.id === CONFIANCE_UUID ? 'confiance' : (safeItem.id || safeItem.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')));

        newDefinitionsCounters[key] = {
            id: safeItem.id,
            name: safeItem.name,
            description: safeItem.description || newDefinitionsCounters[key]?.description || '',
            max: safeItem.formulaId ? 0 : (safeItem.maxValue ?? 10), // Will be calculated if formulaId is present
            value: safeItem.defaultValue ?? newDefinitionsCounters[key]?.value,
            defaultValue: safeItem.defaultValue ?? newDefinitionsCounters[key]?.defaultValue,
            xpCost: safeItem.xpCost ?? newDefinitionsCounters[key]?.xpCost ?? 0,
            appearance: safeItem.appearance === 'squares_only' ? 'squares_only' : undefined,
            formulaId: safeItem.formulaId
        };

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                counters: newDefinitionsCounters
            },
            libraries: { ...rules.libraries, counters: newList }
        });
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleBulkSelect = (active: boolean) => {
        const visibleIds = new Set(filteredList.map(item => item.id));
        const newList = list.map(item => {
            if (!visibleIds.has(item.id)) return item;

            if (!active) {
                const isPlaced = placedNames.has(item.name.trim().toLowerCase());
                const isGloballyUsed = !!globalUsage[item.id];
                const isUsedByTrait = false; // Obsolète : Les compteurs de traits sont instanciés à la volée sur la fiche.

                if (isPlaced || isGloballyUsed || isUsedByTrait) return item; // Cannot deactivate
            }

            return { ...item, isActive: active };
        });

        // No need to update definitions.counters here since it's just isActive flag, 
        // the list remains the same, but wait! Are deactivated counters removed from the definitions map? No, definitions map just stores metadata, active list comes from libraries in the end.

        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, counters: newList }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-120px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Gauge className="text-red-600" /> Bibliothèque de Compteurs
                    </h2>
                    <p className="text-slate-500 text-sm">Définissez les jauges (Santé, Volonté, Sang...).</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCleanDuplicates}
                        className="mr-2 text-slate-500 hover:text-red-600 px-3 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2"
                        title="Fusionner les doublons et corriger les identifiants"
                    >
                        <AlertOctagon size={16} /> Nettoyer
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} /> Nouveau Compteur
                    </button>
                </div>
            </div>

            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={16} className="text-slate-400" />
                </span>
                <input
                    className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded focus:border-red-500 outline-none"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
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

                            // Check if any active trait uses this counter
                            const isUsedByTrait = false; // Obsolète : Les compteurs de traits sont instanciés à la volée sur la fiche et n'utilisent plus la bibliothèque Admin.

                            const isLocked = isPlaced || isGloballyUsed || isUsedByTrait;

                            return (
                                <CounterLibraryItem
                                    key={item.id}
                                    item={item}
                                    isPlaced={isPlaced}
                                    isLocked={isLocked}
                                    onToggleActive={(id: string, current: boolean) => {
                                        // Prevents disabling globally locking trait or local locking trait effect from here, maybe show a toast instead
                                        if (current && isLocked) return;
                                        const newList = list.map(c => c.id === id ? { ...c, isActive: !current } : c);
                                        onUpdate({ ...rules, libraries: { ...rules.libraries, counters: newList } });
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
                        <div>
                            <label htmlFor="counter-category" className="block text-xs font-bold text-slate-500 uppercase mb-1">Catégorie de Placement</label>
                            <select
                                id="counter-category"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-red-500 outline-none bg-white font-bold"
                                value={editingItem.defaultCategory || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, defaultCategory: e.target.value })}
                            >
                                <option value="">-- Par Défaut (Col 9) --</option>
                                {rules.definitions.skillCategories
                                    ?.filter(cat => cat.behavior === 'Compteur')
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label} ({cat.id})</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="bg-amber-500/5 p-3 rounded border border-amber-500/20 mb-2">
                            <label
                                htmlFor="counter-formula"
                                className="block text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-2"
                            >
                                <Calculator size={14} /> Valeur Max (Calculée)
                            </label>
                            <select
                                id="counter-formula"
                                className="w-full border border-stone-200 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none bg-white font-medium mb-3"
                                value={editingItem.formulaId || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, formulaId: e.target.value || undefined })}
                            >
                                <option value="">-- Valeur Fixe (Manuel) --</option>
                                {rules.libraries.formulas
                                    ?.filter(f => f.type === 'variable')
                                    .map(f => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.formula || 'Agrégat'})</option>
                                    ))
                                }
                            </select>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="counter-max" className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        {editingItem.formulaId ? 'Max de Secours' : 'Max (Fixe)'}
                                    </label>
                                    <input
                                        id="counter-max"
                                        type="number"
                                        disabled={!!editingItem.formulaId}
                                        className={`w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-red-500 outline-none ${editingItem.formulaId ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                                        value={editingItem.maxValue ?? 10}
                                        onChange={(e) => setEditingItem({ ...editingItem, maxValue: Number(e.target.value) })}
                                    />
                                </div>
                                <div className={editingItem.formulaId ? 'opacity-40 grayscale pointer-events-none' : ''}>
                                    <label htmlFor="counter-default" className="block text-xs font-bold text-slate-500 uppercase mb-1">Défaut (Rempli)</label>
                                    <input
                                        id="counter-default"
                                        type="number"
                                        disabled={!!editingItem.formulaId}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
                                        value={editingItem.defaultValue ?? 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, defaultValue: Number(e.target.value) })}
                                    />
                                </div>
                                <div className={editingItem.formulaId ? 'opacity-40 grayscale pointer-events-none' : ''}>
                                    <label htmlFor="counter-cost" className="block text-xs font-bold text-slate-500 uppercase mb-1">Coût XP</label>
                                    <input
                                        id="counter-cost"
                                        type="number"
                                        disabled={!!editingItem.formulaId}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
                                        value={editingItem.xpCost ?? 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, xpCost: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="counter-appearance"
                                className="mt-1 accent-red-600 cursor-pointer"
                                checked={editingItem.appearance === 'squares_only'}
                                onChange={(e) => setEditingItem({ ...editingItem, appearance: e.target.checked ? 'squares_only' : null })}
                            />
                            <label htmlFor="counter-appearance" className="text-xs text-slate-600 cursor-pointer">
                                <strong className="text-slate-800 block">Affichage : Carrés uniquement</strong>
                                <span className="text-[10px] block mt-0.5">Masque la rangée de bulles rondes (Points d'origine). Utile pour les jauges dynamiques type compteurs de traits.</span>
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
                title="Supprimer le compteur ?"
                message="Cette action est irréversible pour la base de données."
                confirmLabel="Supprimer"
                type="danger"
            />
        </div>
    );
};

export default AdminCounterLibrary;
