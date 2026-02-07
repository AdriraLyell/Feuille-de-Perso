
import React, { useState, useMemo } from 'react';
import { CharacterSheetData, LibrarySkillEntry } from '../types';
import { BookOpen, GraduationCap, Plus, Search, Trash2, Edit2, CheckCircle2, Download, Award, Layers, RefreshCw } from 'lucide-react';
import TraitLibrary from './TraitLibrary';
import SpecializationLibraryView from './specialization-library/SpecializationLibraryView';
import { useCharacter } from '../context/CharacterContext';
import { useNotification } from '../context/NotificationContext';
import { smartIncludes } from '../utils/stringUtils';
import ThematicModal from './ui/ThematicModal';
import { useRules } from '../context/RulesContext';
import { mergeLibraries, MergedEntry } from '../utils/libraryMerger';
import LibrarySkillForm from './library/LibrarySkillForm';
import LibraryDeleteModal from './library/LibraryDeleteModal';
import LibraryImportModal from './library/LibraryImportModal';
import LibraryRenameModal from './library/LibraryRenameModal';
import { disambiguateCategories } from '../utils/categoryUtils';
import ConfirmationModal from './ui/ConfirmationModal';

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

    // Delete Confirmation Modal State
    const [skillToDelete, setSkillToDelete] = useState<LibrarySkillEntry | null>(null);

    // OFFICIAL: Get Rules Context
    const { rules, updateRules } = useRules();

    // MERGE: Compute Hybrid Skill Library
    const hybridSkills = useMemo(() => {
        const local = data.skillLibrary || [];
        const official = rules?.libraries?.skills || [];

        // We use the same merger logic, works for {id, ...} objects
        return mergeLibraries(local, official);
    }, [data.skillLibrary, rules]);

    // Dynamic Categories Source of Truth
    const availableCategories = useMemo(() => {
        let rawCategories: { code: string, label: string, loc: string }[] = [];

        if (rules?.definitions.skillCategories && rules.definitions.skillCategories.length > 0) {
            rawCategories = rules.definitions.skillCategories.map(cat => ({
                code: cat.id,
                label: cat.label,
                loc: cat.description || ""
            }));
        }

        return disambiguateCategories(rawCategories);
    }, [rules]);

    const getCategoryLabel = (code: string) => {
        return availableCategories.find(c => c.code === code)?.label || code;
    };

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

    const handleSaveSkill = (skillToSave: LibrarySkillEntry) => {
        if (!skillToSave.name.trim()) {
            setSkillError("Le nom de la compétence est requis.");
            return;
        }

        const duplicate = hybridSkills.find(m =>
            m.source === 'local' && // Check duplication only against LOCAL items
            m.entry.id !== skillToSave.id &&
            m.entry.name.trim().toLowerCase() === skillToSave.name.trim().toLowerCase()
        );

        if (duplicate) {
            setSkillError("Une compétence portant ce nom existe déjà.");
            return;
        }

        const existingMerged = skillsList.find(m => m.entry.id === skillToSave.id);
        const existing = existingMerged ? existingMerged.entry : null;
        const nameChanged = existing && existing.name.trim().toLowerCase() !== skillToSave.name.trim().toLowerCase();
        const isUsed = existing && usedSkillNames.has(existing.name.trim().toLowerCase());

        // If name changed and skill is used, ask for confirmation
        if (nameChanged && isUsed) {
            setShowRenameConfirm({ oldName: existing.name, newSkill: skillToSave });
            setIsSkillModalOpen(false); // Close editor, open rename confirm
            return;
        }

        finalizeSaveSkill(skillToSave);
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
            // Cannot delete official.
            // Silent or use a small info toast if we had access to addLog here (we do).
            addLog("Impossible de supprimer une compétence officielle.", "info", "settings");
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

    const [showOfficialUpdateConfirm, setShowOfficialUpdateConfirm] = useState(false);

    const handleOfficialUpdateClick = () => {
        setShowOfficialUpdateConfirm(true);
    };

    const executeOfficialUpdate = async () => {
        try {
            const res = await fetch('./data/skills.json?t=' + Date.now());
            if (!res.ok) throw new Error("Fichier introuvable");

            const json = await res.json();
            const newSkills = json.data as LibrarySkillEntry[];

            if (json.meta && json.meta.type !== 'skills') throw new Error("Format invalide");

            // Update Rules Context
            const updatedRules = {
                ...rules!,
                libraries: {
                    ...rules!.libraries,
                    skills: newSkills
                }
            };
            updateRules(updatedRules);
            addLog(`Bibliothèque officielle mise à jour (${newSkills.length} compétences).`, 'success', 'settings');
        } catch (e) {
            addLog("Échec de la mise à jour officielle : " + (e as Error).message, 'danger', 'settings');
        }
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
                                    onClick={handleOfficialUpdateClick}
                                    className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                                    title="Mettre à jour depuis le serveur officiel"
                                >
                                    <RefreshCw size={14} /> Officiel
                                </button>
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
                                                        {getCategoryLabel(skill.defaultCategory)}
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

            {/* Sub-Components (Modals) */}
            {skillToDelete && (
                <LibraryDeleteModal
                    skillName={skillToDelete.name}
                    onClose={() => setSkillToDelete(null)}
                    onConfirm={executeDeleteSkill}
                />
            )}

            {showImportConfirm && (
                <LibraryImportModal
                    onClose={() => setShowImportConfirm(false)}
                    onConfirm={executeImportFromSheet}
                />
            )}

            {isSkillModalOpen && editingSkill && (
                <LibrarySkillForm
                    isOpen={isSkillModalOpen}
                    onClose={() => setIsSkillModalOpen(false)}
                    title={data.skillLibrary?.some(s => s.id === editingSkill.id) ? 'Éditer Compétence' : 'Nouvelle Compétence (Copie)'}
                    skill={editingSkill}
                    onSkillChange={setEditingSkill}
                    onSave={() => handleSaveSkill(editingSkill)} // Passing editingSkill here
                    error={skillError}
                    categories={availableCategories.length > 0 ? availableCategories : undefined}
                />
            )}

            {showRenameConfirm && (
                <LibraryRenameModal
                    oldName={showRenameConfirm.oldName}
                    newName={showRenameConfirm.newSkill.name}
                    onClose={() => setShowRenameConfirm(null)}
                    onConfirm={() => finalizeSaveSkill(showRenameConfirm.newSkill, true)}
                />
            )}

        </div >
    );
};

export default LibraryView;
