import React, { useState, useMemo } from 'react';
import { CharacterSheetData, LibrarySkillEntry } from '../types';
import { BookOpen, GraduationCap, Plus, Search, Trash2, Edit2, CheckCircle2, Download, Award, Layers, RefreshCw, Eye, EyeOff, Globe } from 'lucide-react';
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
import SkillLibraryTab from './library/SkillLibraryTab';

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
    const [hideKnownSkills, setHideKnownSkills] = useState(true); // Default: Hide known
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
        // 1. Text Search
        const matchesSearch = smartIncludes(m.entry.name, skillSearch) ||
            smartIncludes(m.entry.description || '', skillSearch);

        // 2. Hide Known Filter
        const isKnown = usedSkillNames.has(m.entry.name.trim().toLowerCase());
        const matchesFilter = hideKnownSkills ? !isKnown : true;

        return matchesSearch && matchesFilter;
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

        const cleanedSkill = {
            ...skillToSave,
            variants: skillToSave.variants ? skillToSave.variants.map(v => v.trim()).filter(v => v !== '') : []
        };

        finalizeSaveSkill(cleanedSkill);
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
            currentLib.sort((a: any, b: any) => a.name.localeCompare(b.name));
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
                    <SkillLibraryTab
                        skillsList={skillsList}
                        filteredSkills={filteredSkills}
                        usedSkillNames={usedSkillNames}
                        skillSearch={skillSearch}
                        setSkillSearch={setSkillSearch}
                        hideKnownSkills={hideKnownSkills}
                        setHideKnownSkills={setHideKnownSkills}
                        handleOfficialUpdateClick={handleOfficialUpdateClick}
                        setShowImportConfirm={setShowImportConfirm}
                        handleOpenNewSkill={handleOpenNewSkill}
                        handleOpenEditSkill={handleOpenEditSkill}
                        handleDeleteRequest={handleDeleteRequest}
                        getCategoryLabel={getCategoryLabel}
                    />
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
