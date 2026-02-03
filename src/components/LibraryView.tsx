
import React, { useState, useMemo } from 'react';
import { CharacterSheetData, LibrarySkillEntry } from '../types';
import { BookOpen, GraduationCap, Plus, Search, Trash2, Edit2, X, Save, CheckCircle2, Download, AlertTriangle, HelpCircle, AlertOctagon, Award, ArrowRight, AlertCircle, Layers } from 'lucide-react';
import TraitLibrary from './TraitLibrary';
import SpecializationLibraryView from './specialization-library/SpecializationLibraryView';
import { useCharacter } from '../context/CharacterContext';
import { useNotification } from '../context/NotificationContext';
import { smartIncludes } from '../utils/stringUtils';
import ThematicModal from './ui/ThematicModal';
import { CATEGORY_HELP } from '../data/constants';
import { useRules } from '../context/RulesContext';
import { mergeLibraries, MergedEntry } from '../utils/libraryMerger';
// ... other imports

interface LibraryViewProps {
    data?: CharacterSheetData; // Optional to support standalone use if needed, but we will pass it
    onUpdate?: (newData: CharacterSheetData) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ data: propData, onUpdate: propUpdate }) => {
    // Fallback to context if not provided (for backward compatibility if used elsewhere)
    const { data: contextData, updateData: contextUpdate } = useCharacter();

    const data = propData || contextData;
    const onUpdate = propUpdate || contextUpdate;

    if (!data) return <div className="p-4 text-gray-500 italic">Chargement des données...</div>;

    const [activeTab, setActiveTab] = useState<'traits' | 'skills' | 'specializations'>('traits');
    const addLog = useNotification();

    // -- Skill Library Logic --
    const [skillSearch, setSkillSearch] = useState('');
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState<LibrarySkillEntry | null>(null);
    const [skillError, setSkillError] = useState<string | null>(null);
    const [showRenameConfirm, setShowRenameConfirm] = useState<{ oldName: string, newSkill: LibrarySkillEntry } | null>(null);

    // Import Confirmation Modal State
    const [showImportConfirm, setShowImportConfirm] = useState(false);

    // Help Modal State
    const [showCategoryHelp, setShowCategoryHelp] = useState(false);

    // Delete Confirmation Modal State
    const [skillToDelete, setSkillToDelete] = useState<LibrarySkillEntry | null>(null);

    // OFFICIAL: Get Rules Context
    const { rules } = useRules();

    // MERGE: Compute Hybrid Skill Library
    const hybridSkills = useMemo(() => {
        const local = data.skillLibrary || [];
        const official = rules?.libraries?.skills || [];

        // We use the same merger logic, works for {id, ...} objects
        return mergeLibraries(local, official);
    }, [data.skillLibrary, rules]);

    const skillsList = hybridSkills; // Now we work with MergedEntry<LibrarySkillEntry>[]

    // Determine which skills are currently on the sheet
    const usedSkillNames = useMemo(() => {
        const names = new Set<string>();
        if (data.skills) {
            Object.keys(data.skills).forEach(key => {
                // @ts-ignore
                const list = data.skills[key] || [];
                list.forEach((s: any) => {
                    if (s.name && s.name.trim() !== '') {
                        names.add(s.name.trim().toLowerCase());
                    }
                });
            });
        }
        return names;
    }, [data.skills]);

    const filteredSkills = skillsList.filter(m => {
        const s = m.entry;
        return smartIncludes(s.name, skillSearch) ||
            (s.description && smartIncludes(s.description, skillSearch));
    }).sort((a, b) => a.entry.name.localeCompare(b.entry.name));

    const handleOpenNewSkill = () => {
        setSkillError(null);
        setEditingSkill({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            description: ''
        });
        setIsSkillModalOpen(true);
    };

    const handleOpenEditSkill = (merged: MergedEntry<LibrarySkillEntry>) => {
        setSkillError(null);
        // Force keep official ID to allow creating copy
        setEditingSkill({ ...merged.entry });
        setIsSkillModalOpen(true);
    };

    const handleSaveSkill = () => {
        if (!editingSkill) return;
        if (!editingSkill.name.trim()) {
            setSkillError("Le nom de la compétence est requis.");
            return;
        }

        const duplicate = hybridSkills.find(m =>
            m.source === 'local' && // Check duplication only against LOCAL items
            m.entry.id !== editingSkill.id &&
            m.entry.name.trim().toLowerCase() === editingSkill.name.trim().toLowerCase()
        );

        if (duplicate) {
            setSkillError("Une compétence portant ce nom existe déjà.");
            return;
        }

        const existingMerged = skillsList.find(m => m.entry.id === editingSkill.id);
        const existing = existingMerged ? existingMerged.entry : null;
        const nameChanged = existing && existing.name.trim().toLowerCase() !== editingSkill.name.trim().toLowerCase();
        const isUsed = existing && usedSkillNames.has(existing.name.trim().toLowerCase());

        // If name changed and skill is used, ask for confirmation
        if (nameChanged && isUsed) {
            setShowRenameConfirm({ oldName: existing.name, newSkill: editingSkill });
            return;
        }

        finalizeSaveSkill(editingSkill);
    };

    const finalizeSaveSkill = (skillToSave: LibrarySkillEntry, renameOnSheet: boolean = false) => {
        const localList = data.skillLibrary || [];
        const exists = localList.some(s => s.id === skillToSave.id);

        let newLibrary;
        if (exists) {
            newLibrary = localList.map(s => s.id === skillToSave.id ? skillToSave : s);
        } else {
            // New or cloned from official
            newLibrary = [...localList, skillToSave];
        }

        let newData = { ...data, skillLibrary: newLibrary };

        // Handle global rename on sheet if requested
        if (renameOnSheet && showRenameConfirm) {
            const oldName = showRenameConfirm.oldName.trim().toLowerCase();
            const newName = skillToSave.name.trim();

            const updatedSkills = { ...data.skills };
            Object.keys(updatedSkills).forEach(cat => {
                // @ts-ignore
                if (Array.isArray(updatedSkills[cat])) {
                    // @ts-ignore
                    updatedSkills[cat] = updatedSkills[cat].map(s =>
                        (s.name && s.name.trim().toLowerCase() === oldName)
                            ? { ...s, name: newName }
                            : s
                    );
                }
            });
            newData.skills = updatedSkills;
        }

        onUpdate(newData);
        addLog(`Compétence "${skillToSave.name}" enregistrée dans la réserve.`, 'success', 'settings');
        setIsSkillModalOpen(false);
        setEditingSkill(null);
        setShowRenameConfirm(null);
    };

    const handleDeleteRequest = (merged: MergedEntry<LibrarySkillEntry>) => {
        if (merged.source === 'official') {
            alert("Impossible de supprimer une compétence officielle.");
            return;
        }
        setSkillToDelete(merged.entry);
    };

    const executeDeleteSkill = () => {
        if (!skillToDelete) return;

        const localList = data.skillLibrary || [];
        onUpdate({ ...data, skillLibrary: localList.filter(s => s.id !== skillToDelete.id) });
        addLog(`Compétence "${skillToDelete.name}" supprimée de la réserve.`, 'info', 'settings');
        setSkillToDelete(null);
    };

    // Logic to import skills currently on the sheet into the library
    const executeImportFromSheet = () => {
        // Import into LOCAL
        const currentLib = JSON.parse(JSON.stringify(data.skillLibrary || []));
        const existingNames = new Set(currentLib.map((s: any) => s.name.trim().toLowerCase()));
        let addedCount = 0;

        Object.keys(data.skills).forEach(key => {
            if (key === 'arrieres_plans') return; // Skip backgrounds

            // @ts-ignore
            const sheetSkills = data.skills[key] || [];
            sheetSkills.forEach((skill: any) => {
                const normalized = skill.name ? skill.name.trim() : "";
                if (normalized && !existingNames.has(normalized.toLowerCase())) {
                    currentLib.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: skill.name,
                        description: "",
                        defaultCategory: key // Store origin category as default
                    });
                    existingNames.add(normalized.toLowerCase());
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            // Sort alphabetically
            currentLib.sort((a, b) => a.name.localeCompare(b.name));
            onUpdate({ ...data, skillLibrary: currentLib });
            addLog(`${addedCount} compétence(s) importée(s) depuis la fiche.`, 'success', 'settings');
        } else {
            addLog("Toutes les compétences de la fiche sont déjà dans la réserve.", 'info', 'settings');
        }
        setShowImportConfirm(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#fdfbf7] rounded-sm shadow-sm border border-[#bfae85]/50 overflow-hidden relative">

            {/* Tabs Header */}
            <div className="flex border-b border-[#bfae85]/30 bg-stone-100/30 shrink-0">
                <button
                    onClick={() => setActiveTab('traits')}
                    className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'traits'
                        ? 'border-[#8b2e2e] text-[#8b2e2e] bg-white/50'
                        : 'border-transparent text-[#5c4d41]/60 hover:bg-stone-200/50 hover:text-[#5c4d41]'
                        }`}
                >
                    <BookOpen size={18} />
                    Bibliothèque de Traits
                </button>
                <button
                    onClick={() => setActiveTab('skills')}
                    className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'skills'
                        ? 'border-[#5c4d41] text-[#5c4d41] bg-white/50'
                        : 'border-transparent text-[#5c4d41]/60 hover:bg-stone-200/50 hover:text-[#5c4d41]'
                        }`}
                >
                    <GraduationCap size={18} />
                    Réserve de Compétences
                </button>
                <button
                    onClick={() => setActiveTab('specializations')}
                    className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'specializations'
                        ? 'border-amber-600 text-amber-700 bg-white/50'
                        : 'border-transparent text-[#5c4d41]/60 hover:bg-stone-200/50 hover:text-[#5c4d41]'
                        }`}
                >
                    <Award size={18} />
                    Bibliothèque de Spécialisations
                </button>
            </div>

            {/* Content */}
            <div className="flex-grow min-h-0 relative">
                {activeTab === 'traits' && (
                    // Use existing component logic, wrapped to fit height
                    <div className="absolute inset-0">
                        <TraitLibrary data={data} onUpdate={onUpdate} isEditable={true} />
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="absolute inset-0 flex flex-col bg-[#fdfbf7]">
                        {/* Skill Toolbar */}
                        <div className="p-3 bg-stone-100/30 border-b border-[#bfae85]/30 grid grid-cols-1 lg:grid-cols-3 items-center gap-4 shrink-0">
                            {/* Search Bar - Left */}
                            <div className="relative w-full max-w-sm">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3b32]/50" />
                                <input
                                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80"
                                    placeholder="Rechercher une compétence..."
                                    value={skillSearch}
                                    onChange={(e) => setSkillSearch(e.target.value)}
                                />
                            </div>

                            {/* Shared Legend - Center */}
                            <div className="flex justify-center gap-3">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50/50 border border-green-200/50 rounded-full w-fit">
                                    <CheckCircle2 size={10} className="text-green-600" />
                                    <span className="text-[9px] font-bold text-green-800/70 uppercase tracking-tight whitespace-nowrap">Présent</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50/50 border border-blue-200/50 rounded-full w-fit">
                                    <Layers size={10} className="text-blue-600" />
                                    <span className="text-[9px] font-bold text-blue-800/70 uppercase tracking-tight whitespace-nowrap">À Variations</span>
                                </div>
                            </div>

                            {/* Actions - Right */}
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowImportConfirm(true)}
                                    className="bg-white/80 border border-[#bfae85]/50 text-[#5c4d41] hover:bg-stone-50 hover:text-[#1c1917] px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                                    title="Ajouter toutes les compétences de la fiche à la réserve"
                                >
                                    <Download size={14} /> Importer
                                </button>
                                <button
                                    onClick={handleOpenNewSkill}
                                    className="bg-[#5c4d41] hover:bg-[#4a3b32] text-white px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                                >
                                    <Plus size={14} /> Créer
                                </button>
                            </div>
                        </div>

                        {/* Skill List */}
                        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                            {skillsList.length === 0 ? (
                                <div className="text-center text-[#5c4d41]/60 py-10 italic px-4 text-sm flex flex-col items-center">
                                    <GraduationCap size={48} className="opacity-20 mb-2" />
                                    <p>La réserve de compétences est vide.</p>
                                    <p className="text-xs mt-2 text-[#5c4d41]/80 italic">
                                        Utilisez le bouton <strong>"Importer de la fiche"</strong> pour la remplir automatiquement <br />
                                        avec vos compétences actuelles.
                                    </p>
                                </div>
                            ) : filteredSkills.length === 0 ? (
                                <div className="text-center text-[#5c4d41]/60 py-10 italic">Aucune compétence trouvée.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredSkills.map(merged => {
                                        const skill = merged.entry;
                                        const isUsed = usedSkillNames.has(skill.name.trim().toLowerCase());
                                        const isOfficial = merged.source === 'official';

                                        return (
                                            <div
                                                key={skill.id}
                                                className={`border rounded-sm p-2 group flex flex-col justify-between transition-all bg-white/60 ${isUsed
                                                    ? 'border-green-300/40 bg-green-50/10'
                                                    : isOfficial ? 'border-blue-300/40 bg-blue-50/5' : 'border-[#bfae85]/30 hover:border-amber-400/50 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between items-center gap-2">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {skill.isVariable && (
                                                                <span title="Compétence à variations">
                                                                    <Layers size={10} className="text-blue-600 shrink-0" />
                                                                </span>
                                                            )}
                                                            {isOfficial && (
                                                                <span title="Compétence Officielle" className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded-sm border border-blue-200 font-bold shrink-0">OFF</span>
                                                            )}
                                                            {isUsed && (
                                                                <span title="Présent dans la fiche">
                                                                    <CheckCircle2 size={10} className="text-green-600 shrink-0" />
                                                                </span>
                                                            )}
                                                            <span className={`font-serif font-black uppercase text-[11px] tracking-wide truncate ${isUsed ? 'text-green-800' : 'text-[#4a3b32]'}`}>
                                                                {skill.name}
                                                            </span>
                                                        </div>

                                                        <div className="flex gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleOpenEditSkill(merged)} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="Éditer/Voir"><Edit2 size={12} /></button>
                                                            {!isUsed && !isOfficial && (
                                                                <button onClick={() => handleDeleteRequest(merged)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Supprimer"><Trash2 size={12} /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {skill.description && (
                                                        <p className="text-[10px] text-[#5c4d41] italic line-clamp-1 leading-tight opacity-70" title={skill.description}>{skill.description}</p>
                                                    )}
                                                </div>
                                                {skill.defaultCategory && (
                                                    <span className="text-[8px] text-amber-800/50 font-mono bg-amber-100/20 px-1 py-0.5 rounded-sm self-start mt-1 border border-amber-200/10">
                                                        {skill.defaultCategory}
                                                    </span>
                                                )}

                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'specializations' && (
                    <div className="absolute inset-0">
                        <SpecializationLibraryView data={data} onUpdate={onUpdate} />
                    </div>
                )}
            </div>

            {/* Category Help Modal */}

            {/* Delete Confirmation Modal */}
            {
                skillToDelete && (
                    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in duration-200 border-2 border-red-100">
                            <div className="p-6 text-center">
                                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Trash2 size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer la compétence ?</h3>
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4">
                                    <span className="block font-bold text-gray-800 text-lg">{skillToDelete.name}</span>
                                </div>
                                <p className="text-[#5c4d41] text-sm leading-relaxed">
                                    Cette action est irréversible. La compétence sera retirée de la réserve.
                                </p>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
                                <button
                                    onClick={() => setSkillToDelete(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={executeDeleteSkill}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} /> Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Import Confirmation Modal */}
            {
                showImportConfirm && (
                    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in duration-200">
                            <div className="p-6 text-center">
                                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                    <Download size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Importer depuis la fiche ?</h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                    Cette action va scanner votre fiche de personnage et ajouter toutes les compétences trouvées à la réserve.
                                </p>
                                <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200 text-left flex gap-2">
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                    <span>Les doublons (compétences portant le même nom) seront ignorés pour éviter les répétitions.</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
                                <button
                                    onClick={() => setShowImportConfirm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={executeImportFromSheet}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm transition-colors"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Skill Edit Modal */}
            {
                isSkillModalOpen && editingSkill && (
                    <ThematicModal
                        isOpen={isSkillModalOpen}
                        onClose={() => setIsSkillModalOpen(false)}
                        title={data.skillLibrary?.some(s => s.id === editingSkill.id) ? 'Éditer Compétence' : 'Nouvelle Compétence (Copie)'}
                        icon={<GraduationCap size={20} />}
                        size={showCategoryHelp ? 'lg' : 'md'}
                        footer={
                            <>
                                <button onClick={() => setIsSkillModalOpen(false)} className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold">Annuler</button>
                                <button onClick={handleSaveSkill} className="px-6 py-2 bg-[#5c4d41] text-white rounded-sm font-bold shadow-md hover:bg-[#4a3b32] flex items-center gap-2">
                                    <Save size={16} /> Enregistrer
                                </button>
                            </>
                        }
                    >
                        <div className="flex flex-col lg:flex-row gap-8 py-2">
                            {/* Editor Form */}
                            <div className="flex-grow flex flex-col gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Nom de la compétence</label>
                                    <input
                                        className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-serif font-black text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                                        value={editingSkill.name}
                                        onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Description (Narrative)</label>
                                    <textarea
                                        className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-3 text-sm text-[#1c1917] bg-white/50 min-h-[120px] focus:border-amber-500 outline-none resize-none shadow-sm italic leading-relaxed"
                                        value={editingSkill.description || ''}
                                        onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase tracking-widest">Catégorie de placement par défaut</label>
                                        {!showCategoryHelp && (
                                            <button
                                                onClick={() => setShowCategoryHelp(true)}
                                                className="text-[#5c4d41] hover:text-[#8b2e2e] transition-colors flex items-center gap-1 text-[9px] font-bold"
                                                title="Voir l'aide sur les catégories"
                                            >
                                                <HelpCircle size={14} /> Aide
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 text-sm text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm font-bold"
                                        value={editingSkill.defaultCategory || ''}
                                        onChange={(e) => setEditingSkill({ ...editingSkill, defaultCategory: e.target.value })}
                                    >
                                        <option value="">-- Placement libre --</option>
                                        {CATEGORY_HELP.map(cat => (
                                            <option key={cat.code} value={cat.code}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-[#5c4d41] mt-1.5 italic px-1">Définit dans quelle section de la fiche cette compétence sera rangée lors de l'importation.</p>
                                </div>
                                <div className="bg-amber-50/50 border border-amber-200/50 rounded-sm p-3 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isVariableSkill"
                                        className="w-4 h-4 accent-amber-600 cursor-pointer"
                                        checked={editingSkill.isVariable || false}
                                        onChange={(e) => setEditingSkill({ ...editingSkill, isVariable: e.target.checked })}
                                    />
                                    <label htmlFor="isVariableSkill" className="cursor-pointer select-none">
                                        <span className="block text-xs font-bold text-[#5c4d41] uppercase tracking-wide">Compétence à Spécialité / Variable</span>
                                        <span className="block text-[10px] text-[#5c4d41]/70 italic mt-0.5">Cochez si le joueur doit préciser quelque chose (ex: "Artisanat : Forge"). Permet d'avoir plusieurs fois cette compétence.</span>
                                    </label>
                                </div>
                                {skillError && (
                                    <div className="bg-red-50 text-red-800 text-[11px] p-3 rounded-sm border border-red-200 font-bold flex items-center gap-2 animate-shake">
                                        <AlertOctagon size={16} /> {skillError}
                                    </div>
                                )}
                            </div>

                            {/* Side Help Panel */}
                            {showCategoryHelp && (
                                <div className="w-full lg:w-72 shrink-0 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex justify-between items-center mb-2 border-b border-[#bfae85]/30 pb-1">
                                        <span className="text-[10px] font-serif font-black uppercase text-[#8b2e2e] tracking-widest flex items-center gap-1">
                                            <HelpCircle size={12} /> Aide aux catégories
                                        </span>
                                        <button
                                            onClick={() => setShowCategoryHelp(false)}
                                            className="text-[#5c4d41] hover:text-[#8b2e2e] p-0.5 rounded"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="p-0 overflow-hidden bg-white/30 rounded-sm border border-[#bfae85]/30 relative">
                                        <table className="w-full text-[10px] text-left border-collapse">
                                            <thead className="bg-[#fdfbf7] border-b border-[#bfae85]/50 transition-colors">
                                                <tr>
                                                    <th className="px-3 py-2 font-black tracking-widest text-[#8b2e2e]">Code</th>
                                                    <th className="px-3 py-2 font-black tracking-widest text-[#8b2e2e]">Emplacement</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#bfae85]/20">
                                                {CATEGORY_HELP.map((cat, i) => (
                                                    <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                                        <td className="px-3 py-1.5 font-mono text-[#8b2e2e] font-bold">{cat.code}</td>
                                                        <td className="px-3 py-1.5 text-[#4a3b32]">
                                                            <div className="font-bold leading-tight">{cat.label}</div>
                                                            <div className="text-[8px] text-[#5c4d41]/70 italic leading-tight">{cat.loc}</div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="mt-3 text-[9px] text-[#5c4d41]/70 leading-relaxed italic border-l-2 border-[#bfae85]/30 pl-2">
                                        Conseil : Copiez-collez le code technique exact pour un tri automatique parfait.
                                    </p>
                                </div>
                            )}
                        </div>
                    </ThematicModal>
                )
            }

            {/* Rename Confirmation Modal */}
            {
                showRenameConfirm && (
                    <ThematicModal
                        isOpen={!!showRenameConfirm}
                        onClose={() => setShowRenameConfirm(null)}
                        title="Renommer la compétence ?"
                        icon={<AlertTriangle size={24} className="text-[#8b2e2e]" />}
                        size="md"
                        footer={
                            <>
                                <button
                                    onClick={() => setShowRenameConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-[#bfae85]/50 rounded-sm text-[#5c4d41] font-bold hover:bg-stone-200/50 transition-colors"
                                >
                                    Non, annuler
                                </button>
                                <button
                                    onClick={() => finalizeSaveSkill(showRenameConfirm.newSkill, true)}
                                    className="flex-1 px-4 py-2 bg-[#8b2e2e] text-white rounded-sm font-bold shadow-md hover:bg-[#6a2424] transition-colors"
                                >
                                    Oui, renommer partout
                                </button>
                            </>
                        }
                    >
                        <div className="flex flex-col items-center text-center space-y-5 py-4">
                            <div className="w-16 h-16 bg-[#8b2e2e]/10 text-[#8b2e2e] rounded-full flex items-center justify-center shadow-inner">
                                <Edit2 size={32} />
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm text-[#5c4d41] leading-relaxed max-w-sm">
                                    Cette modification sera répercutée sur **toutes les instances** de cette compétence présentes sur votre fiche.
                                </p>
                                <div className="flex items-center justify-center gap-3 text-sm font-serif bg-stone-100/50 px-4 py-2 rounded-sm border border-[#bfae85]/30">
                                    <span className="line-through text-red-700/60 opacity-60 uppercase tracking-wider">{showRenameConfirm.oldName}</span>
                                    <ArrowRight size={14} className="text-[#bfae85]" />
                                    <span className="font-black text-green-800 uppercase tracking-widest">{showRenameConfirm.newSkill.name}</span>
                                </div>
                            </div>

                            <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-sm flex gap-3 text-left">
                                <AlertCircle className="text-amber-700 shrink-0" size={18} />
                                <p className="text-[10px] text-amber-900 leading-tight">
                                    <strong>Notes :</strong> Vos points acquis, l'expérience dépensée et les spécialisations déjà saisies seront intégralement conservés sous le nouveau nom.
                                </p>
                            </div>
                        </div>
                    </ThematicModal>
                )
            }
        </div >
    );
};

export default LibraryView;
