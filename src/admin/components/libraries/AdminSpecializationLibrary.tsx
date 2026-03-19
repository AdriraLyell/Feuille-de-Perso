import React from 'react';
import { Search, Plus, Award, Save, UploadCloud, CheckCircle2, Circle, X } from 'lucide-react';
import { RulesData } from '../../../types/rules';
import ThematicModal from '../../../components/ui/ThematicModal';
import { useItemUsageDetails } from '../../../hooks/admin/useItemUsageDetails';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { useAdminSpecializationLibrary } from '../../../hooks/admin/useAdminSpecializationLibrary';

// Sub components
import { SpecListItem } from './specialization/SpecListItem';
import { SpecModalContent } from './specialization/SpecModalContent';

interface AdminSpecializationLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

const AdminSpecializationLibrary: React.FC<AdminSpecializationLibraryProps> = ({ rules, onUpdate, globalUsage = {} }) => {
    const {
        searchTerm, setSearchTerm,
        isModalOpen, setIsModalOpen,
        editingEntry, setEditingEntry,
        error,
        selectedSkillFilter, setSelectedSkillFilter,
        skillFilterSearch, setSkillFilterSearch,
        showSkillSuggestions, setShowSkillSuggestions,
        skillSearch, setSkillSearch,
        showPublishConfirm, setShowPublishConfirm,
        showDeleteConfirm, setShowDeleteConfirm,
        library,
        allSkills,
        filteredLibrary,
        filteredSkillsForModal,
        filteredSkillsForFilter,
        handleOpenNew,
        handleOpenEdit,
        handleDelete,
        confirmDelete,
        handleSave,
        handleToggle,
        handleBulkSelect,
        handlePublishClick,
        executePublish
    } = useAdminSpecializationLibrary(rules, onUpdate, globalUsage);

    const { usageDetailsCache, loadDetails } = useItemUsageDetails('global', 'specialization');

    return (
        <div className="flex flex-col h-full bg-[#fdfbf7] rounded-sm shadow-sm border border-[#bfae85]/50 overflow-hidden relative min-h-[500px]">
            {/* Toolbar */}
            <div className="p-4 bg-stone-100/30 border-b border-[#bfae85]/30 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="relative flex-grow max-w-md w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search size={16} className="text-[#4a3b32]/50" />
                    </span>
                    <input
                        className="w-full pl-9 pr-9 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80"
                        placeholder="Rechercher une spécialité..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a3b32]/40 hover:text-amber-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                    {selectedSkillFilter ? (
                        <div className="flex items-center justify-between gap-2 bg-amber-100/80 border border-amber-300/50 px-3 py-1.5 rounded-sm text-xs shadow-inner animate-in fade-in zoom-in duration-200">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] text-amber-700/70 font-bold uppercase tracking-tighter">Compétence parent</span>
                                <span className="text-amber-900 font-bold truncate leading-tight">
                                    {allSkills.find(s => s.id === selectedSkillFilter)?.name || selectedSkillFilter}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedSkillFilter('')}
                                className="text-amber-700 hover:text-amber-900 bg-amber-200/50 hover:bg-amber-200 p-1 rounded-full transition-colors shrink-0"
                                title="Enlever le filtre"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="relative h-[34px]">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search size={14} className="text-[#4a3b32]/50" />
                            </span>
                            <input
                                className="w-full pl-9 pr-3 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80 h-full"
                                placeholder="Filtrer par compétence..."
                                value={skillFilterSearch}
                                onChange={(e) => {
                                    setSkillFilterSearch(e.target.value);
                                    setShowSkillSuggestions(true);
                                }}
                                onFocus={() => setShowSkillSuggestions(true)}
                                onBlur={() => {
                                    setTimeout(() => setShowSkillSuggestions(false), 200);
                                }}
                            />
                            {showSkillSuggestions && filteredSkillsForFilter.length > 0 && (
                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#bfae85]/50 rounded-sm shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-1 duration-200">
                                    <div className="p-1.5 bg-stone-50 border-b border-[#bfae85]/20 text-[9px] font-bold text-[#bfae85] uppercase tracking-wider">
                                        Résultats de recherche
                                    </div>
                                    {filteredSkillsForFilter.map(skill => (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            className="w-full text-left px-4 py-2 text-xs hover:bg-amber-100/50 text-[#1c1917] transition-colors border-b border-[#bfae85]/10 last:border-0 flex items-center justify-between group"
                                            onClick={() => {
                                                setSelectedSkillFilter(skill.id);
                                                setSkillFilterSearch('');
                                                setShowSkillSuggestions(false);
                                            }}
                                        >
                                            <span className="truncate group-hover:font-bold transition-all">{skill.name}</span>
                                            <Plus size={10} className="text-amber-600 opacity-0 group-hover:opacity-100" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handlePublishClick}
                        className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                        title="Publier specializations.json"
                    >
                        <UploadCloud size={14} /> Publier JSON
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="bg-[#5c4d41] hover:bg-[#4a3b32] text-white px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                    >
                        <Plus size={14} /> Créer
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {library.length > 0 && (
                <div className="flex gap-4 px-4 py-2 bg-stone-50/50 border-b border-[#bfae85]/20 shrink-0">
                    <button
                        onClick={() => handleBulkSelect(true)}
                        className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                    >
                        <CheckCircle2 size={12} />
                        Tout activer {searchTerm ? `(${filteredLibrary.length})` : ''}
                    </button>
                    <button
                        onClick={() => handleBulkSelect(false)}
                        className="text-[10px] font-bold text-stone-500 hover:text-stone-700 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                    >
                        <Circle size={12} />
                        Tout désactiver {searchTerm ? `(${filteredLibrary.length})` : ''}
                    </button>
                </div>
            )}

            {/* List */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {library.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic px-4 text-sm flex flex-col items-center">
                        <Award size={48} className="opacity-20 mb-2" />
                        <p>La bibliothèque de spécialités officielles est vide.</p>
                        <p className="text-xs mt-2 text-[#5c4d41]/80 italic">Ajoutez des spécialités standards proposées à tous les joueurs.</p>
                    </div>
                ) : filteredLibrary.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic">Aucun résultat.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredLibrary.map(entry => (
                            <SpecListItem
                                key={entry.id}
                                entry={entry}
                                isLocked={(globalUsage[entry.id] || 0) > 0}
                                allSkills={allSkills}
                                onEdit={handleOpenEdit}
                                onDelete={handleDelete}
                                onToggle={handleToggle}
                                usageDetails={usageDetailsCache.get(entry.id)}
                                onLoadUsageDetails={loadDetails}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <ThematicModal
                isOpen={isModalOpen && !!editingEntry}
                onClose={() => setIsModalOpen(false)}
                title={library.some(e => e.id === editingEntry?.id) ? 'Éditer Spécialité' : 'Nouvelle Spécialité'}
                icon={<Award size={20} />}
                size="md"
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold">Annuler</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-[#5c4d41] text-white rounded-sm font-bold shadow-md hover:bg-[#4a3b32] flex items-center gap-2">
                            <Save size={16} /> Enregistrer
                        </button>
                    </>
                }
            >
                {editingEntry && (
                    <SpecModalContent
                        editingEntry={editingEntry}
                        setEditingEntry={setEditingEntry}
                        skillSearch={skillSearch}
                        setSkillSearch={setSkillSearch}
                        filteredSkillsForModal={filteredSkillsForModal}
                        error={error}
                    />
                )}
            </ThematicModal>

            <ConfirmationModal
                isOpen={showPublishConfirm}
                onClose={() => setShowPublishConfirm(false)}
                onConfirm={executePublish}
                title="Publier les spécialités ?"
                message="Vous allez mettre à jour le fichier specializations.json public."
                confirmLabel="Publier"
                type="warning"
            />

            <ConfirmationModal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Supprimer la spécialité ?"
                message="Cette action supprimera définitivement l'entrée de la base admin."
                confirmLabel="Supprimer"
                type="danger"
            />
        </div>
    );
};

export default AdminSpecializationLibrary;
