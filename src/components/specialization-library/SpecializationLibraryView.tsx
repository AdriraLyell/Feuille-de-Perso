
import React, { useState, useMemo } from 'react';
import { Search, Plus, Award, CheckCircle2, Edit2, Trash2, Download, HelpCircle, Save, X, AlertTriangle } from 'lucide-react';
import { useCharacter } from '../../context/CharacterContext';
import { useNotification } from '../../context/NotificationContext';
import { LibrarySpecializationEntry } from '../../types';
import { smartIncludes } from '../../utils/stringUtils';

const SpecializationLibraryView: React.FC = () => {
    const { data, updateData: onUpdate } = useCharacter();
    const addLog = useNotification();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<LibrarySpecializationEntry | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<LibrarySpecializationEntry | null>(null);
    const [skillSearch, setSkillSearch] = useState('');

    const library = data.specializationLibrary || [];

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
        return library.filter(entry =>
            smartIncludes(entry.name, searchTerm) ||
            (entry.description && smartIncludes(entry.description, searchTerm))
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [library, searchTerm]);

    // Déterminer quelles spécialisations sont déjà utilisées sur la fiche
    const usedSpecializations = useMemo(() => {
        const names = new Set<string>();
        Object.values(data.specializations).forEach(spes => {
            spes.forEach(s => names.add(s.trim().toLowerCase()));
        });
        Object.values(data.imposedSpecializations).forEach(spes => {
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

    const handleOpenEdit = (entry: LibrarySpecializationEntry) => {
        setError(null);
        setSkillSearch('');
        setEditingEntry({ ...entry });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingEntry) return;
        if (!editingEntry.name.trim()) {
            setError("Le nom est requis.");
            return;
        }

        const duplicate = library.find(e =>
            e.id !== editingEntry.id &&
            e.name.trim().toLowerCase() === editingEntry.name.trim().toLowerCase()
        );

        if (duplicate) {
            setError("Une spécialisation portant ce nom existe déjà.");
            return;
        }

        let newLibrary;
        const exists = library.some(e => e.id === editingEntry.id);
        if (exists) {
            newLibrary = library.map(e => e.id === editingEntry.id ? editingEntry : e);
        } else {
            newLibrary = [...library, editingEntry];
        }

        onUpdate({ ...data, specializationLibrary: newLibrary });
        addLog(`Spécialisation "${editingEntry.name}" enregistrée.`, 'success', 'settings');
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const executeImportFromSheet = () => {
        const currentLib = [...library];
        const existingNames = new Set(currentLib.map(e => e.name.trim().toLowerCase()));
        let addedCount = 0;

        // Scanner les spécialisations classiques
        Object.entries(data.specializations).forEach(([skillId, spes]) => {
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
        Object.entries(data.imposedSpecializations).forEach(([skillId, spes]) => {
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

    const executeDelete = () => {
        if (!entryToDelete) return;
        onUpdate({
            ...data,
            specializationLibrary: library.filter(e => e.id !== entryToDelete.id)
        });
        addLog(`Spécialisation "${entryToDelete.name}" supprimée.`, 'info', 'settings');
        setEntryToDelete(null);
    };

    return (
        <div className="absolute inset-0 flex flex-col bg-white">
            {/* Toolbar */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="relative flex-grow max-w-md w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c4d41]/60" />
                    <input
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:border-amber-500 outline-none text-gray-800 placeholder-gray-400 bg-white"
                        placeholder="Rechercher une spécialisation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowImportConfirm(true)}
                        className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                    >
                        <Download size={16} /> Importer
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                    >
                        <Plus size={16} /> Créer
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {library.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic px-4 text-sm flex flex-col items-center">
                        <Award size={48} className="opacity-20 mb-2" />
                        <p>La bibliothèque de spécialisations est vide.</p>
                        <p className="text-xs mt-2">Peuplez-la manuellement ou importez l'existant.</p>
                    </div>
                ) : filteredLibrary.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic">Aucun résultat.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredLibrary.map(entry => {
                            const isUsed = usedSpecializations.has(entry.name.trim().toLowerCase());
                            return (
                                <div
                                    key={entry.id}
                                    className={`border rounded-lg p-3 transition-all bg-white group flex flex-col justify-between ${isUsed
                                        ? 'border-green-200 bg-green-50/30'
                                        : 'border-gray-200 hover:shadow-md hover:border-amber-300'
                                        }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold text-sm ${isUsed ? 'text-green-800' : 'text-gray-800'}`}>
                                                {entry.name}
                                            </span>
                                            {isUsed && (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold border border-green-200">
                                                    <CheckCircle2 size={10} /> Utilisée
                                                </span>
                                            )}
                                            {!isUsed && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenEdit(entry)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                                                    <button onClick={() => setEntryToDelete(entry)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                                </div>
                                            )}
                                        </div>
                                        {entry.description && (
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{entry.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {entry.skillIds.map(sid => {
                                                const s = allSkills.find(sk => sk.id === sid);
                                                return (
                                                    <span key={sid} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                        {s ? s.name : sid}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-[#5c4d41]/60 flex justify-between items-center">
                                        <span>Seuil MJ : <span className="font-bold text-amber-600">{entry.defaultMinLevel}</span></span>
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
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center text-white bg-amber-700">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Award size={20} />
                                {library.some(e => e.id === editingEntry.id) ? 'Éditer Spécialisation' : 'Nouvelle Spécialisation'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-bold text-gray-900 bg-white focus:border-amber-500 outline-none"
                                    value={editingEntry.name}
                                    onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Compétences associées</label>
                                <div className="relative mb-2">
                                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5c4d41]/60" />
                                    <input
                                        className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-200 rounded focus:border-amber-500 outline-none"
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
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-white custom-scrollbar">
                                    {filteredSkillsForModal.length === 0 ? (
                                        <div className="col-span-2 text-center py-2 text-[10px] text-[#5c4d41]/60 italic">Aucun résultat.</div>
                                    ) : filteredSkillsForModal.map(skill => (
                                        <label key={skill.id} className={`flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors ${editingEntry.skillIds.includes(skill.id) ? 'bg-amber-50/50' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={editingEntry.skillIds.includes(skill.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...editingEntry.skillIds, skill.id]
                                                        : editingEntry.skillIds.filter(id => id !== skill.id);
                                                    setEditingEntry({ ...editingEntry, skillIds: ids });
                                                }}
                                                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className={`truncate ${editingEntry.skillIds.includes(skill.id) ? 'font-bold text-amber-900' : 'text-gray-700'}`}>{skill.name}</span>
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
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seuil minimum par défaut (MJ)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-amber-500 outline-none"
                                    value={editingEntry.defaultMinLevel}
                                    onChange={(e) => setEditingEntry({ ...editingEntry, defaultMinLevel: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-[10px] text-[#5c4d41]/60 mt-1 italic">Ce seuil sera appliqué automatiquement lors de l'ajout en mode "Imposée".</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-h-[80px] focus:border-amber-500 outline-none resize-none"
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

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-bold">Annuler</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-amber-600 text-white rounded font-bold shadow-md hover:bg-amber-700 flex items-center gap-2">
                                <Save size={16} /> Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Confirm */}
            {showImportConfirm && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                <Download size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Importer les spécialisations ?</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Scanne toutes les spécialisations (Joueur & MJ) présentes sur la fiche pour les ajouter à la bibliothèque.
                            </p>
                            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200 text-left flex gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <span>Les spécialisations portant le même nom seront ignorées.</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
                            <button onClick={() => setShowImportConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white transition-colors">Annuler</button>
                            <button onClick={executeImportFromSheet} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-sm transition-colors">Confirmer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {entryToDelete && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border-2 border-red-100">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer ?</h3>
                            <p className="text-gray-800 font-bold mb-4">{entryToDelete.name}</p>
                            <p className="text-gray-500 text-sm">Cette action retirera la spécialisation de la bibliothèque (sans l'effacer de la fiche).</p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t">
                            <button onClick={() => setEntryToDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white transition-colors">Annuler</button>
                            <button onClick={executeDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecializationLibraryView;
