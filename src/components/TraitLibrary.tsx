import React, { useState } from 'react';
import { CharacterSheetData, LibraryEntry } from '../types';
import { Search, Plus, BookOpen, Filter, Coins, Layers, ArrowDownAZ, ArrowUpAZ, Download, RefreshCw, X, Globe, Zap, Sparkles } from 'lucide-react';
import TraitCard from './trait-library/TraitCard';
import TraitForm from './trait-library/TraitForm';
import TraitImportModal from './trait-library/TraitImportModal';
import TraitVariantPicker from './trait-library/TraitVariantPicker';
import ConfirmationModal from './ui/ConfirmationModal';
import { useTraitLibrary, SortOption, SortOrder } from '../hooks/useTraitLibrary';
import { useTraitSelection } from '../hooks/useTraitSelection';
import { useTraitActions } from '../hooks/useTraitActions';
import { useRules } from '../context/RulesContext';

interface TraitLibraryProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onSelect?: (entry: LibraryEntry) => void;
    onMultiSelect?: (instances: { entry: LibraryEntry; variant?: string; cost?: string }[]) => void;
    isEditable?: boolean;
    defaultFilter?: 'all' | 'avantage' | 'desavantage';
    hidePossessed?: boolean;
    lockFilter?: boolean;
}

const TraitLibrary: React.FC<TraitLibraryProps> = ({
    data, onUpdate, onSelect, onMultiSelect,
    isEditable = true, defaultFilter = 'all', hidePossessed = false, lockFilter = false
}) => {
    const { rules } = useRules();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'avantage' | 'desavantage'>(defaultFilter);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const { processedList, hybridList, allAvailableTags } = useTraitLibrary(
        data, searchTerm, filterType, selectedTags, sortBy, sortOrder, hidePossessed
    );

    const {
        isModalOpen,
        setIsModalOpen,
        editForm,
        setEditForm,
        tagInput,
        setTagInput,
        error,
        showDeleteConfirm,
        setShowDeleteConfirm,
        showOfficialUpdateConfirm,
        setShowOfficialUpdateConfirm,
        updateResult,
        setUpdateResult,
        handleOpenNew,
        handleOpenEdit,
        handleDelete,
        confirmDelete,
        handleSave,
        executeOfficialUpdate,
        handleImportTraits,
        addTag,
        removeTag,
        addEffect,
        updateEffect,
        removeEffect,
        allSkills,
        allAttributes,
        allCounters,
        allFormulas
    } = useTraitActions(data, onUpdate, filterType === 'all' ? 'avantage' : filterType);

    const {
        selection,
        variantPicker,
        setVariantPicker,
        toggleSelection,
        addInstanceWithVariant,
        removeInstance,
        handleConfirmMultiSelect
    } = useTraitSelection(onMultiSelect, allFormulas);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const handleSortChange = (criteria: SortOption) => {
        if (sortBy === criteria) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(criteria); setSortOrder('asc'); }
    };

    const toggleTagFilter = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const showFooter = !!onMultiSelect;

    return (
        <div className="flex flex-col h-full bg-[#fdfbf7] rounded-sm shadow-sm border border-[#bfae85]/50 overflow-hidden relative">
            <div className="p-4 bg-stone-100/30 border-b border-[#bfae85]/30 flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-[#4a3b32] flex items-center gap-2">
                        <BookOpen size={20} className="text-[#8b2e2e]" /> Bibliothèque de Traits
                    </h3>
                    {isEditable && (
                        <div className="flex gap-2">
                            <button onClick={() => setShowOfficialUpdateConfirm(true)} className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap" title="Mettre à jour depuis le serveur officiel">
                                <RefreshCw size={14} /> Officiel
                            </button>
                            <button onClick={() => setIsImportModalOpen(true)} className="bg-white/80 border border-[#bfae85]/50 text-[#5c4d41] hover:bg-stone-50 hover:text-[#1c1917] px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap" title="Importer des traits depuis la fiche de personnage">
                                <Download size={14} /> Importer
                            </button>
                            <button onClick={handleOpenNew} className="bg-[#5c4d41] hover:bg-[#4a3b32] text-white px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap">
                                <Plus size={14} /> Créer
                            </button>
                        </div>
                    )}
                </div>

                {/* Legend Section */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-[#bfae85]/10">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50/50 border border-blue-200/50 rounded-full w-fit">
                        <Globe size={10} className="text-indigo-600" />
                        <span className="text-[9px] font-bold text-indigo-800/70 uppercase tracking-tight whitespace-nowrap">Officiel</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50/50 border border-blue-200/50 rounded-full w-fit">
                        <Layers size={10} className="text-blue-600" />
                        <span className="text-[9px] font-bold text-blue-800/70 uppercase tracking-tight whitespace-nowrap">Variant</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50/50 border border-amber-200/50 rounded-full w-fit">
                        <Zap size={10} className="text-amber-500 fill-amber-500" />
                        <span className="text-[9px] font-bold text-amber-800/70 uppercase tracking-tight whitespace-nowrap">Effets</span>
                    </div>
                </div>

                <div className="flex gap-2 items-center flex-wrap md:flex-nowrap">
                    <div className="relative flex-grow min-w-[150px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3b32]/50" />
                        <input
                            className="w-full pl-9 pr-9 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4a3b32]/40 hover:text-amber-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {!lockFilter && (
                        <div className="flex bg-[#bfae85]/20 rounded-sm p-0.5 shrink-0">
                            {['all', 'avantage', 'desavantage'].map((t) => (
                                <button key={t} onClick={() => setFilterType(t as 'all' | 'avantage' | 'desavantage')} className={`px-3 py-1 text-xs font-bold rounded-sm transition-colors ${filterType === t ? 'bg-white text-[#5c4d41] shadow-sm' : 'text-[#5c4d41]/70 hover:text-[#5c4d41]'}`}>
                                    {t === 'all' ? 'Tout' : t === 'avantage' ? 'Avantages' : 'Désavantages'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs border-t border-[#bfae85]/20 pt-2">
                    <span className="font-bold text-[#5c4d41]/70 uppercase tracking-wide">Trier par :</span>
                    <button
                        onClick={() => handleSortChange('name')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border transition-all ${sortBy === 'name' ? 'bg-amber-100/50 border-amber-300 text-amber-900 font-bold' : 'bg-white/50 border-[#bfae85]/30 text-[#5c4d41] hover:bg-stone-50'}`}
                        title="Trier par ordre alphabétique"
                    >
                        {sortBy === 'name' ? (sortOrder === 'asc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />) : <ArrowDownAZ size={14} className="opacity-40" />}
                        Nom
                    </button>
                    <button
                        onClick={() => handleSortChange('cost')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border transition-all ${sortBy === 'cost' ? 'bg-amber-100/50 border-amber-300 text-amber-900 font-bold' : 'bg-white/50 border-[#bfae85]/30 text-[#5c4d41] hover:bg-stone-50'}`}
                        title="Trier par coût en points"
                    >
                        <Coins size={14} className={sortBy === 'cost' ? 'text-amber-600' : 'opacity-40'} />
                        Coût {sortBy === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSortChange('type')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border transition-all ${sortBy === 'type' ? 'bg-amber-100/50 border-amber-300 text-amber-900 font-bold' : 'bg-white/50 border-[#bfae85]/30 text-[#5c4d41] hover:bg-stone-50'}`}
                        title="Trier par type (Avantage/Désavantage)"
                    >
                        <Layers size={14} className={sortBy === 'type' ? 'text-blue-600' : 'opacity-40'} />
                        Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                </div>

                {allAvailableTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <Filter size={14} className="text-[#4a3b32]/50 shrink-0" />
                        <div className="flex gap-1">
                            {allAvailableTags.map(tag => (
                                <button key={tag} onClick={() => toggleTagFilter(tag)} className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap ${selectedTags.includes(tag) ? 'bg-[#8b2e2e] text-white border-[#8b2e2e]' : 'bg-white/50 text-[#5c4d41] border-[#bfae85]/30 hover:border-[#bfae85]/60'}`}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                        {selectedTags.length > 0 && <button onClick={() => setSelectedTags([])} className="text-[10px] text-red-700/70 hover:text-red-800 whitespace-nowrap px-1">Effacer filtres</button>}
                    </div>
                )}
            </div>

            <div className={`flex-grow overflow-y-auto p-0 min-h-0 ${showFooter ? 'pb-16' : ''}`}>
                {hybridList.length === 0 && (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic px-4 text-sm">
                        {isEditable ? "La bibliothèque est vide. Ajoutez des avantages et désavantages ici pour les réutiliser facilement." : "La bibliothèque est vide."}
                    </div>
                )}
                {hybridList.length > 0 && processedList.length === 0 && (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic px-4">Aucun trait ne correspond à votre recherche.</div>
                )}

                <div className="divide-y divide-[#bfae85]/20">
                    {processedList.map(merged => (
                        <TraitCard
                            key={merged.entry.id}
                            entry={merged.entry}
                            isEditable={isEditable}
                            isSelected={selection.some(s => s.entry.id === merged.entry.id)}
                            onSelect={onSelect ? (entry) => onSelect(entry) : undefined}
                            onMultiSelect={(id) => toggleSelection(id, hybridList)}
                            onEdit={() => handleOpenEdit(merged)}
                            onDelete={(id) => handleDelete(id, merged.source)}
                            showMultiSelect={!!onMultiSelect}
                            source={merged.source}
                        />
                    ))}
                </div>
            </div>

            {
                showFooter && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#fdfbf7] border-t border-[#bfae85]/30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col gap-2 z-20">
                        {selection.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto py-1">
                                {selection.map(s => (
                                    <div key={s.tempId} className="flex items-center gap-1 bg-amber-100/50 border border-amber-200 rounded-full pl-2 pr-1 py-0.5 text-[10px] text-amber-900 group/item animate-in zoom-in-50 duration-200">
                                        <span className="font-bold">{s.entry.name}</span>
                                        {s.variant && <span className="opacity-60 italic">: {s.variant}</span>}
                                        <button onClick={() => removeInstance(s.tempId)} className="p-0.5 hover:bg-amber-200 rounded-full transition-colors"><X size={10} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#5c4d41]">{selection.length} trait(s) sélectionné(s)</span>
                                {!data.creationConfig?.active && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                        <Sparkles size={12} />
                                        Coût total : {selection.reduce((sum, s) => {
                                            const traitCostFactor = rules?.configurations?.xpCosts?.traitCost ?? (data.xpCosts?.traitCost ?? 5);
                                            return sum + (parseInt(s.cost || s.entry.cost || "0") * traitCostFactor);
                                        }, 0)} XP
                                    </div>
                                )}
                            </div>
                            <button onClick={handleConfirmMultiSelect} disabled={selection.length === 0} className="bg-[#5c4d41] hover:bg-[#4a3b32] disabled:item-stone-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-sm font-bold text-sm flex items-center gap-2 shadow-sm transition-all">
                                <Plus size={16} /> Ajouter la sélection
                            </button>
                        </div>
                    </div>
                )
            }

            {
                isImportModalOpen && (
                    <TraitImportModal
                        data={data}
                        onClose={() => setIsImportModalOpen(false)}
                        onImport={(entries) => { handleImportTraits(entries); setIsImportModalOpen(false); }}
                    />
                )
            }

            {
                variantPicker && (
                    <TraitVariantPicker
                        variantPicker={variantPicker}
                        onClose={() => setVariantPicker(null)}
                        onSelect={addInstanceWithVariant}
                        allFormulas={allFormulas}
                        allSkills={allSkills}
                        allAttributes={allAttributes}
                    />
                )
            }

            {
                isModalOpen && editForm && (
                    <TraitForm
                        editForm={editForm}
                        library={[]}
                        allSkills={allSkills}
                        allAttributes={allAttributes}
                        allCounters={allCounters}
                        allFormulas={allFormulas}
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
                isOpen={showOfficialUpdateConfirm}
                onClose={() => setShowOfficialUpdateConfirm(false)}
                onConfirm={executeOfficialUpdate}
                title="Mise à jour officielle"
                message="Voulez-vous télécharger la dernière version de la bibliothèque officielle ? Cela remplacera les traits officiels existants mais ne touchera pas à vos traits personnels."
                confirmLabel="Mettre à jour"
                type="info"
            />

            <ConfirmationModal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Supprimer le trait ?"
                message="Cette action supprimera ce trait de votre bibliothèque locale. Elle ne pourra pas être annulée."
                confirmLabel="Supprimer"
                type="danger"
            />

            <ConfirmationModal
                isOpen={!!updateResult}
                onClose={() => setUpdateResult(null)}
                onConfirm={() => setUpdateResult(null)}
                title={updateResult?.success ? "Succès" : "Erreur"}
                message={updateResult?.message || ""}
                confirmLabel="OK"
                type={updateResult?.success ? "success" : "danger"}
                cancelLabel=""
            />
        </div >
    );
};

export default TraitLibrary;
