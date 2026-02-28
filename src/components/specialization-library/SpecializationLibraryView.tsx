import React, { useMemo } from 'react';
import { Search, Plus, Award, CheckCircle2, Edit2, Trash2, Download, RefreshCw, Eye, EyeOff, Globe, X } from 'lucide-react';
import { CharacterSheetData } from '../../types';
import { useSpecializationLibrary } from './hooks/useSpecializationLibrary';
import SpecializationEditModal from './parts/SpecializationEditModal';
import ConfirmationModal from '../ui/ConfirmationModal';

interface SpecializationLibraryViewProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
}

const SpecializationLibraryView: React.FC<SpecializationLibraryViewProps> = ({ data, onUpdate }) => {
    const {
        searchTerm, setSearchTerm,
        hideKnown, setHideKnown,
        isModalOpen, setIsModalOpen,
        editingEntry, setEditingEntry,
        error,
        showImportConfirm, setShowImportConfirm,
        entryToDelete, setEntryToDelete,
        skillSearch, setSkillSearch,
        showOfficialUpdateConfirm, setShowOfficialUpdateConfirm,
        allSkills,
        usedSpecializations,
        filteredLibrary,
        handleOpenNew,
        handleOpenEdit,
        handleSave,
        executeOfficialUpdate,
        executeImportFromSheet,
        handleDeleteRequest,
        executeDelete
    } = useSpecializationLibrary({ data, onUpdate });

    const isExisting = useMemo(() => {
        return !!(editingEntry && data.specializationLibrary?.some(e => e.id === editingEntry.id));
    }, [editingEntry, data.specializationLibrary]);

    return (
        <div className="absolute inset-0 flex flex-col bg-[#fdfbf7]">
            {/* Toolbar */}
            <div className="p-4 bg-stone-100/30 border-b border-[#bfae85]/30 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="relative flex-grow max-w-md w-full flex gap-2">
                    <div className="relative flex-grow">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3b32]/50" />
                        <input
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80"
                            placeholder="Rechercher une spécialisation..."
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
                    <button
                        onClick={() => setHideKnown(!hideKnown)}
                        className={`px-2 py-1.5 rounded-sm border transition-colors flex items-center justify-center ${hideKnown ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-[#5c4d41] border-[#bfae85]/50 hover:bg-stone-50'}`}
                        title={hideKnown ? "Afficher les spécialisations acquises" : "Masquer les spécialisations acquises"}
                    >
                        {hideKnown ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowOfficialUpdateConfirm(true)}
                        className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                        title="Mettre à jour depuis le serveur officiel"
                    >
                        <RefreshCw size={14} /> Officiel
                    </button>
                    <button
                        onClick={() => setShowImportConfirm(true)}
                        className="bg-white/80 border border-[#bfae85]/50 text-[#5c4d41] hover:bg-stone-50 hover:text-[#1c1917] px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                    >
                        <Download size={14} /> Importer
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="bg-[#5c4d41] hover:bg-[#4a3b32] text-white px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                    >
                        <Plus size={14} /> Créer
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {filteredLibrary.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic px-4 text-sm flex flex-col items-center">
                        <Award size={48} className="opacity-20 mb-2" />
                        <p>{searchTerm ? "Aucun résultat." : "La bibliothèque de spécialisations est vide."}</p>
                        {!searchTerm && <p className="text-xs mt-2 text-[#5c4d41]/80 italic">Peuplez-la manuellement ou importez l'existant.</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredLibrary.map(merged => {
                            const entry = merged.entry;
                            const isUsed = usedSpecializations.has(entry.name.trim().toLowerCase());
                            const isOfficial = merged.source === 'official';

                            return (
                                <div
                                    key={entry.id}
                                    className={`border rounded-sm p-3 transition-all bg-white/60 group flex flex-col justify-between ${isUsed
                                        ? 'border-green-300/40 bg-green-50/10'
                                        : isOfficial ? 'border-blue-300/40 bg-blue-50/5' : 'border-[#bfae85]/30 hover:border-amber-400/50 hover:shadow-sm'
                                        }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex flex-col">
                                                <span className={`font-serif font-black uppercase text-xs tracking-wide ${isUsed ? 'text-green-800' : 'text-[#4a3b32]'}`}>
                                                    {entry.name}
                                                </span>
                                                {isOfficial && (
                                                    <div title="Spécialisation Officielle" className="w-fit mt-0.5">
                                                        <Globe size={11} className="text-indigo-500" />
                                                    </div>
                                                )}
                                            </div>

                                            {isUsed && (
                                                <span className="text-[9px] bg-green-100/50 text-green-800/80 px-1.5 py-0.5 rounded-sm flex items-center gap-1 font-bold border border-green-200/50 uppercase tracking-tight">
                                                    <CheckCircle2 size={10} /> Utilisée
                                                </span>
                                            )}
                                            {!isUsed && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenEdit(merged)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                                                    {!isOfficial && (
                                                        <button onClick={() => handleDeleteRequest(merged)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {entry.description && (
                                            <p className="text-[10px] text-[#5c4d41] italic line-clamp-2 mb-2 leading-tight opacity-80">{entry.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {entry.skillIds.map(sid => {
                                                const s = allSkills.find(sk => sk.id === sid);
                                                return (
                                                    <span key={sid} className="text-[9px] bg-stone-100/50 text-[#5c4d41] px-1.5 py-0.5 rounded-sm border border-[#bfae85]/20">
                                                        {s ? s.name : sid}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-[#5c4d41]/60 flex justify-between items-center border-t border-[#bfae85]/20 pt-1">
                                        <span>Seuil MJ : <span className="font-bold text-amber-700">{entry.defaultMinLevel}</span></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isModalOpen && editingEntry && (
                <SpecializationEditModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    editingEntry={editingEntry}
                    setEditingEntry={setEditingEntry}
                    handleSave={handleSave}
                    allSkills={allSkills}
                    skillSearch={skillSearch}
                    setSkillSearch={setSkillSearch}
                    error={error}
                    isExisting={isExisting}
                />
            )}

            <ConfirmationModal
                isOpen={showImportConfirm}
                onClose={() => setShowImportConfirm(false)}
                onConfirm={executeImportFromSheet}
                title="Importer les spécialisations ?"
                message="Scanne toutes les spécialisations (Joueur & MJ) présentes sur la fiche pour les ajouter à la bibliothèque. Les doublons seront ignorés."
                confirmLabel="Confirmer l'import"
                type="info"
            />

            <ConfirmationModal
                isOpen={!!entryToDelete}
                onClose={() => setEntryToDelete(null)}
                onConfirm={executeDelete}
                title="Supprimer ?"
                message={`Voulez-vous vraiment supprimer "${entryToDelete?.name}" de la bibliothèque ?`}
                confirmLabel="Supprimer"
                type="danger"
            />

            <ConfirmationModal
                isOpen={showOfficialUpdateConfirm}
                onClose={() => setShowOfficialUpdateConfirm(false)}
                onConfirm={executeOfficialUpdate}
                title="Mise à jour officielle"
                message="Voulez-vous vérifier et télécharger les dernières spécialisations officielles ?"
                confirmLabel="Mettre à jour"
                type="info"
            />
        </div>
    );
};

export default SpecializationLibraryView;
