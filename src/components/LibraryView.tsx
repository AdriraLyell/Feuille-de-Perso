import React, { useState, useMemo } from 'react';
import { CharacterSheetData } from '../types';
import { BookOpen, GraduationCap, Award } from 'lucide-react';
import TraitLibrary from './TraitLibrary';
import SpecializationLibraryView from './specialization-library/SpecializationLibraryView';
import { useCharacter } from '../context/CharacterContext';
import { useNotification } from '../context/NotificationContext';
import { useRules } from '../context/RulesContext';

import LibrarySkillForm from './library/LibrarySkillForm';
import LibraryDeleteModal from './library/LibraryDeleteModal';
import LibraryImportModal from './library/LibraryImportModal';
import LibraryRenameModal from './library/LibraryRenameModal';
import { disambiguateCategories } from '../utils/categoryUtils';
import SkillLibraryTab from './library/SkillLibraryTab';
import { useSkillLibrary } from '../hooks/library/useSkillLibrary';

interface LibraryViewProps {
    data?: CharacterSheetData; // Optional to support standalone use if needed, but we will pass it
    onUpdate?: (newData: CharacterSheetData) => void;
    isEditable?: boolean;
}

const LibraryView: React.FC<LibraryViewProps> = ({ data: propData, onUpdate: propUpdate, isEditable = true }) => {
    // Fallback to context if not provided (for backward compatibility if used elsewhere)
    const { data: contextData, updateData: contextUpdate } = useCharacter();

    const data = propData || contextData;
    const onUpdate = propUpdate || contextUpdate;

    if (!data) return <div className="p-4 text-gray-500 italic">Chargement des données...</div>;

    const [activeTab, setActiveTab] = useState<'traits' | 'skills' | 'specializations'>('traits');
    const addLog = useNotification();

    // OFFICIAL: Get Rules Context
    const { rules } = useRules();

    // MERGE: Compute Hybrid Skill Library
    const {
        skillSearch, setSkillSearch,
        hideKnownSkills, setHideKnownSkills,
        isSkillModalOpen, setIsSkillModalOpen,
        editingSkill, setEditingSkill,
        skillError,
        showRenameConfirm, setShowRenameConfirm,
        showImportConfirm, setShowImportConfirm,
        skillToDelete, setSkillToDelete,
        hybridSkills,
        usedSkillNames,
        filteredSkills,
        handleOpenNewSkill,
        handleOpenEditSkill,
        handleSaveSkill,
        finalizeSaveSkill,
        handleDeleteRequest,
        executeDeleteSkill,
        executeImportFromSheet,
        skillFormSource
    } = useSkillLibrary(data, rules, onUpdate, addLog);

    // OFFICIAL: Use local state for visibility for now (could be moved to hook too if shared)


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

    const handleOfficialUpdateClick = () => {
        addLog("Option gérée par le MJ", "info");
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
                        <TraitLibrary data={data} onUpdate={onUpdate} isEditable={isEditable} />
                    </div>
                )}

                {activeTab === 'skills' && (
                    <SkillLibraryTab
                        skillsList={hybridSkills}
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
                        isEditable={isEditable}
                    />
                )}

                {activeTab === 'specializations' && (
                    <div className="absolute inset-0">
                        <SpecializationLibraryView data={data} onUpdate={onUpdate} isEditable={isEditable} />
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
                    isOfficial={skillFormSource === 'official'}
                    onClose={() => setIsSkillModalOpen(false)}
                    title={!isEditable ? 'Détails Compétence' : data.skillLibrary?.some(s => s.id === editingSkill.id) ? 'Éditer Compétence' : 'Nouvelle Compétence (Copie)'}
                    skill={editingSkill}
                    onSkillChange={setEditingSkill}
                    onSave={() => handleSaveSkill(editingSkill)} // Passing editingSkill here
                    error={skillError}
                    categories={availableCategories.length > 0 ? availableCategories : undefined}
                    isEditable={isEditable}
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
