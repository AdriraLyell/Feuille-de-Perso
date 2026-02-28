
import React from 'react';
import { RulesData } from '../../../types/rules';
import { Search, Plus, BookOpen, Filter, Coins, Layers, ArrowDownAZ, ArrowUpAZ, UploadCloud, CheckCircle2, Circle, Globe, X } from 'lucide-react';
import TraitCard from '../../../components/trait-library/TraitCard';
import TraitForm from '../../../components/trait-library/TraitForm';
import TriStateChip from '../../../components/ui/TriStateChip';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { useAdminTraitLibrary } from '../../../hooks/admin/useAdminTraitLibrary';
import { useItemUsageDetails } from '../../../hooks/admin/useItemUsageDetails';

interface AdminTraitLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

const AdminTraitLibrary: React.FC<AdminTraitLibraryProps> = ({ rules, onUpdate, globalUsage = {} }) => {
    const {
        // States
        searchTerm, setSearchTerm,
        selectedTags, setSelectedTags,
        activeFilter, setActiveFilter,
        sourceFilter, setSourceFilter,
        typeFilter, setTypeFilter,
        sortBy, setSortBy,
        sortOrder, setSortOrder,
        isModalOpen, setIsModalOpen,
        editForm, setEditForm,
        tagInput, setTagInput,
        error,
        showPublishConfirm, setShowPublishConfirm,
        showDeleteConfirm, setShowDeleteConfirm,
        publishResult, setPublishResult,
        showConfigAlert, setShowConfigAlert,

        // Derived Data
        library,
        processedList,
        allAvailableTags,
        allSkills,
        allAttributes,
        allCounters,
        allFormulas,

        // Handlers
        handleOpenNew,
        handleOpenEdit,
        handleDelete,
        confirmDelete,
        handleSave,
        handleBulkSelect,
        handleToggleActive,
        handlePublishClick,
        executePublish,
        addTag,
        removeTag,
        addEffect,
        updateEffect,
        updateEffectFields,
        removeEffect
    } = useAdminTraitLibrary({ rules, onUpdate, globalUsage });
    const { usageDetailsCache, loadDetails } = useItemUsageDetails('global', 'trait');


    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-120px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="text-blue-600" /> Bibliothèque de Traits Officiels
                    </h2>
                    <p className="text-slate-500 text-sm">Gérez ici les Avantages et Désavantages qui seront proposés aux joueurs.</p>
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
                        className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded focus:border-blue-500 outline-none"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
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
                                        onChange={() => handleToggleActive(entry.id)}
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
                                        usageDetails={usageDetailsCache.get(entry.id)}
                                        onLoadUsageDetails={loadDetails}
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
