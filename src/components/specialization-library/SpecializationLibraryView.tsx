
import React, { useState, useMemo } from 'react';
import { Search, Plus, Award, CheckCircle2, Edit2, Trash2, Download, HelpCircle, Save, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { CharacterSheetData } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { LibrarySpecializationEntry } from '../../types';
import { smartIncludes } from '../../utils/stringUtils';
import { useRules } from '../../context/RulesContext';
import { mergeLibraries, MergedEntry } from '../../utils/libraryMerger';
import ConfirmationModal from '../ui/ConfirmationModal';

interface SpecializationLibraryViewProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
}

const SpecializationLibraryView: React.FC<SpecializationLibraryViewProps> = ({ data, onUpdate }) => {
    const addLog = useNotification();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<LibrarySpecializationEntry | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<LibrarySpecializationEntry | null>(null);
    const [skillSearch, setSkillSearch] = useState('');

    // OFFICIAL: Get Rules Context
    const { rules, updateRules } = useRules();

    // MERGE: Compute Hybrid Specialization Library
    const hybridSpecializations = useMemo(() => {
        const local = data.specializationLibrary || [];
        const official = rules?.libraries?.specializations || [];

        return mergeLibraries(local, official);
    }, [data.specializationLibrary, rules]);

    const library = hybridSpecializations; // Now MergedEntry[]

    // Liste plate de toutes les compétences pour le mapping
    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];
        if (data.skills) {
            Object.values(data.skills).forEach(category => {
                category.forEach(skill => {
                    if (skill.name && skill.name.trim() !== '') {
                        skills.push({ id: skill.id, name: skill.name });
                    }
                });
            });
        }
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.skills]);

    // Compétences filtrées pour la modale
    const filteredSkillsForModal = useMemo(() => {
        return allSkills.filter(s =>
            smartIncludes(s.name, skillSearch) || (editingEntry?.skillIds.includes(s.id))
        );
    }, [allSkills, skillSearch, editingEntry?.skillIds]);

    // Filtrer et trier la bibliothèque
    const filteredLibrary = useMemo(() => {
        return library.filter(m =>
            smartIncludes(m.entry.name, searchTerm) ||
            (m.entry.description && smartIncludes(m.entry.description, searchTerm))
        ).sort((a, b) => a.entry.name.localeCompare(b.entry.name));
    }, [library, searchTerm]);

    // Déterminer quelles spécialisations sont déjà utilisées sur la fiche
    const usedSpecializations = useMemo(() => {
        const names = new Set<string>();
        Object.values(data.specializations || {}).forEach(spes => {
            spes.forEach(s => names.add(s.trim().toLowerCase()));
        });
        Object.values(data.imposedSpecializations || {}).forEach(spes => {
            spes.forEach(s => names.add(s.name.trim().toLowerCase()));
        });
        return names;
    }, [data.specializations, data.imposedSpecializations]);

    const handleOpenNew = () => {
        setError(null);
        setEditingEntry({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            skillIds: [],
            defaultMinLevel: 1,
            description: ''
        });
        setSkillSearch('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (merged: MergedEntry<LibrarySpecializationEntry>) => {
        setError(null);
        setSkillSearch('');
        // Force keep official ID to allow creating copy
        setEditingEntry({ ...merged.entry });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingEntry) return;
        if (!editingEntry.name.trim()) {
            setError("Le nom est requis.");
            return;
        }

        const duplicate = hybridSpecializations.find(m =>
            m.source === 'local' && // Check duplication only against LOCAL items
            m.entry.id !== editingEntry.id &&
            m.entry.name.trim().toLowerCase() === editingEntry.name.trim().toLowerCase()
        );

        if (duplicate) {
            setError("Une spécialisation locale portant ce nom existe déjà.");
            return;
        }

        let newLibrary;
        const localList = data.specializationLibrary || [];
        const exists = localList.some(e => e.id === editingEntry.id);

        if (exists) {
            newLibrary = localList.map(e => e.id === editingEntry.id ? editingEntry : e);
        } else {
            // New or cloned from official
            newLibrary = [...localList, editingEntry];
        }

        onUpdate({ ...data, specializationLibrary: newLibrary });
        addLog(`Spécialisation "${editingEntry.name}" enregistrée.`, 'success', 'settings');
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const [showOfficialUpdateConfirm, setShowOfficialUpdateConfirm] = useState(false);

    const handleOfficialUpdateClick = () => {
        setShowOfficialUpdateConfirm(true);
    };

    const executeOfficialUpdate = async () => {
        try {
            const res = await fetch('./data/specializations.json?t=' + Date.now());
            if (!res.ok) throw new Error("Fichier introuvable");

            const json = await res.json();
            const newSpecs = json.data as LibrarySpecializationEntry[];

            if (json.meta && json.meta.type !== 'specializations') throw new Error("Format invalide");

            // Update Rules Context
            const updatedRules = {
                ...rules!,
                libraries: {
                    ...rules!.libraries,
                    specializations: newSpecs
                }
            };
            updateRules(updatedRules);
            addLog(`Bibliothèque officielle mise à jour (${newSpecs.length} spécialisations).`, 'success', 'settings');
        } catch (e) {
            // @ts-ignore
            addLog("Échec de la mise à jour officielle : " + (e as Error).message, 'danger', 'settings');
        }
    };

    const executeImportFromSheet = () => {
        // Import into LOCAL
        const currentLib = JSON.parse(JSON.stringify(data.specializationLibrary || []));
        const existingNames = new Set(currentLib.map((e: any) => e.name.trim().toLowerCase()));
        let addedCount = 0;

        // Scanner les spécialisations classiques
        Object.entries(data.specializations || {}).forEach(([skillId, spes]) => {
            spes.forEach(name => {
                const norm = name.trim();
                if (norm && !existingNames.has(norm.toLowerCase())) {
                    currentLib.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: norm,
                        skillIds: [skillId],
                        defaultMinLevel: 1,
                        description: ""
                    });
                    existingNames.add(norm.toLowerCase());
                    addedCount++;
                }
            });
        });

        // Scanner les spécialisations imposées
        Object.entries(data.imposedSpecializations || {}).forEach(([skillId, spes]) => {
            spes.forEach(s => {
                const norm = s.name.trim();
                if (norm && !existingNames.has(norm.toLowerCase())) {
                    currentLib.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: norm,
                        skillIds: [skillId],
                        defaultMinLevel: s.minLevel,
                        description: ""
                    });
                    existingNames.add(norm.toLowerCase());
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            currentLib.sort((a, b) => a.name.localeCompare(b.name));
            onUpdate({ ...data, specializationLibrary: currentLib });
            addLog(`${addedCount} spécialisation(s) importée(s) depuis la fiche.`, 'success', 'settings');
        } else {
            addLog("Toutes les spécialisations de la fiche sont déjà dans la bibliothèque.", 'info', 'settings');
        }
        setShowImportConfirm(false);
    };

    const handleDeleteRequest = (merged: MergedEntry<LibrarySpecializationEntry>) => {
        if (merged.source === 'official') {
            addLog("Impossible de supprimer une spécialisation officielle.", 'info', 'settings');
            return;
        }
        setEntryToDelete(merged.entry);
    };

    const executeDelete = () => {
        if (!entryToDelete) return;
        const localList = data.specializationLibrary || [];
        onUpdate({
            ...data,
            specializationLibrary: localList.filter(e => e.id !== entryToDelete.id)
        });
        addLog(`Spécialisation "${entryToDelete.name}" supprimée.`, 'info', 'settings');
        setEntryToDelete(null);
    };

    return (
        <div className="absolute inset-0 flex flex-col bg-[#fdfbf7]">
            {/* Toolbar */}
            <div className="p-4 bg-stone-100/30 border-b border-[#bfae85]/30 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="relative flex-grow max-w-md w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3b32]/50" />
                    <input
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80"
                        placeholder="Rechercher une spécialisation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleOfficialUpdateClick}
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
                {library.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic px-4 text-sm flex flex-col items-center">
                        <Award size={48} className="opacity-20 mb-2" />
                        <p>La bibliothèque de spécialisations est vide.</p>
                        <p className="text-xs mt-2 text-[#5c4d41]/80 italic">Peuplez-la manuellement ou importez l'existant.</p>
                    </div>
                ) : filteredLibrary.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic">Aucun résultat.</div>
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
                                                    <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded-sm border border-blue-200 font-bold w-fit mt-0.5">OFFICIEL</span>
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

            {/* Modals ... (à implémenter ou intégrer) */}
            {isModalOpen && editingEntry && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in duration-200 border-2 border-[#bfae85]/50">
                        <div className="p-4 border-b border-[#bfae85]/50 flex justify-between items-center text-white bg-amber-700/90">
                            <h3 className="font-bold text-lg flex items-center gap-2 font-serif tracking-wide">
                                <Award size={20} />
                                {data.specializationLibrary?.some(e => e.id === editingEntry.id) ? 'Éditer Spécialisation' : 'Nouvelle Spécialisation (Copie)'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 bg-[#fdfbf7] flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                            <div>
                                <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Nom</label>
                                <input
                                    className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-black font-serif text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                                    value={editingEntry.name}
                                    onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Compétences associées</label>
                                <div className="relative mb-2">
                                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5c4d41]/60" />
                                    <input
                                        className="w-full pl-7 pr-2 py-1 text-[11px] border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none bg-white/50"
                                        placeholder="Filtrer les compétences..."
                                        value={skillSearch}
                                        onChange={(e) => setSkillSearch(e.target.value)}
                                    />
                                    {skillSearch && (
                                        <button
                                            onClick={() => setSkillSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5c4d41]/60 hover:text-gray-600"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-[#bfae85]/50 rounded-sm p-2 bg-white/30 custom-scrollbar">
                                    {filteredSkillsForModal.length === 0 ? (
                                        <div className="col-span-2 text-center py-2 text-[10px] text-[#5c4d41]/60 italic">Aucun résultat.</div>
                                    ) : filteredSkillsForModal.map(skill => (
                                        <label key={skill.id} className={`flex items-center gap-2 text-xs cursor-pointer hover:bg-stone-100/50 p-1 rounded transition-colors ${editingEntry.skillIds.includes(skill.id) ? 'bg-amber-100/30' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={editingEntry.skillIds.includes(skill.id) || editingEntry.skillIds.includes(skill.name)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...editingEntry.skillIds, skill.id]
                                                        : editingEntry.skillIds.filter(id => id !== skill.id && id !== skill.name);
                                                    setEditingEntry({ ...editingEntry, skillIds: ids });
                                                }}
                                                className="rounded border-[#bfae85]/50 text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className={`truncate ${editingEntry.skillIds.includes(skill.id) ? 'font-bold text-amber-900' : 'text-[#4a3b32]'}`}>{skill.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {editingEntry.skillIds.length > 0 && (
                                    <div className="mt-1 text-[9px] text-[#5c4d41]/60 italic">
                                        {editingEntry.skillIds.length} compétence(s) sélectionnée(s)
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Seuil minimum par défaut (MJ)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 text-sm bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                                    value={editingEntry.defaultMinLevel}
                                    onChange={(e) => setEditingEntry({ ...editingEntry, defaultMinLevel: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-[10px] text-[#5c4d41]/60 mt-1 italic">Ce seuil sera appliqué automatiquement lors de l'ajout en mode "Imposée".</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Description</label>
                                <textarea
                                    className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 text-sm bg-white/50 min-h-[80px] focus:border-amber-500 outline-none resize-none shadow-sm italic text-[#4a3b32]"
                                    value={editingEntry.description || ''}
                                    onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-xs p-2 rounded border border-red-200 font-bold">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-[#bfae85]/30 bg-stone-100/30 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold">Annuler</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-[#5c4d41] text-white rounded-sm font-bold shadow-md hover:bg-[#4a3b32] flex items-center gap-2">
                                <Save size={16} /> Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
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
