import React, { useState } from 'react';
import { RulesData } from '../../types/rules';
import { LibrarySkillEntry } from '../../types';
import { AlertCircle, FolderSync, CheckCircle2 } from 'lucide-react';
import { disambiguateCategories } from '../../utils/categoryUtils';
import AdminSkillLibrarySidebar from './libraries/AdminSkillLibrarySidebar';
import SkillCategoryCard from './skills/SkillCategoryCard';

interface AdminSkillsEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

type DragItem = { type: 'admin_sheet_skill' | 'admin_lib_skill', category?: string, index?: number, name?: string, data?: any };

const AdminSkillsEditor: React.FC<AdminSkillsEditorProps> = ({ rules, onUpdate }) => {
    const definitions = rules.definitions;
    const skillsMap = definitions.skills || {};
    const skillCategories = definitions.skillCategories || [];
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
    const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

    // -- Library Sync Logic --
    const ensureSkillInLibrary = (skillName: string, category: string, currentRules: RulesData): RulesData | null => {
        if (!skillName || skillName.trim() === "" || skillName === "Nouvelle Compétence") return null;

        const lib = currentRules.libraries?.skills || [];
        const exists = lib.some(s => s.name.trim().toLowerCase() === skillName.trim().toLowerCase());

        if (!exists) {
            const newEntry: LibrarySkillEntry = {
                id: crypto.randomUUID(),
                name: skillName.trim(),
                description: "",
                defaultCategory: category,
                isVariable: false
            };
            const newLib = [...lib, newEntry].sort((a, b) => a.name.localeCompare(b.name));

            return {
                ...currentRules,
                libraries: {
                    ...currentRules.libraries,
                    skills: newLib
                }
            };
        }
        return null;
    };

    const handleSkillBlur = (category: string, skillName: string) => {
        const updatedRules = ensureSkillInLibrary(skillName, category, rules);
        if (updatedRules) {
            onUpdate(updatedRules);
        }
    };

    const handleSyncAll = () => {
        let currentRules = { ...rules };
        let addedCount = 0;

        skillCategories.forEach(cat => {
            const skills = skillsMap[cat.id] || [];
            skills.forEach(skillName => {
                const updated = ensureSkillInLibrary(skillName, cat.id, currentRules);
                if (updated) {
                    currentRules = updated;
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            onUpdate(currentRules);
            setSyncSuccess(`${addedCount} compétence(s) ajoutée(s) à la bibliothèque.`);
            setTimeout(() => setSyncSuccess(null), 3000);
        } else {
            setSyncSuccess("Bibliothèque déjà à jour.");
            setTimeout(() => setSyncSuccess(null), 3000);
        }
    };

    const updateSkillList = (category: string, newList: string[]) => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                skills: {
                    ...rules.definitions.skills,
                    [category]: newList
                }
            }
        });
    };

    const updateLabel = (category: string, newLabel: string) => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                skillCategories: skillCategories.map(cat =>
                    cat.id === category ? { ...cat, label: newLabel } : cat
                )
            }
        });
    };

    const updateBehavior = (category: string, behavior: any) => {
        // Déterminer les coûts par défaut selon le behavior
        let factor = 1;
        let type: 'linear' | 'triangular' = 'triangular';

        if (behavior === 'Secondaire') {
            factor = 0.5;
            type = 'triangular';
        } else if (behavior === 'Arrière-plan' || behavior === 'Compteur') {
            factor = 1;
            type = 'linear';
        }

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                skillCategories: skillCategories.map(cat =>
                    cat.id === category
                        ? {
                            ...cat,
                            behavior,
                            costConfig: { factor, type } // Mise à jour automatique des coûts
                        }
                        : cat
                )
            }
        });
    };


    const addSkill = (category: string, isSpacer = false) => {
        const currentList = skillsMap[category] || [];
        updateSkillList(category, [...currentList, isSpacer ? "" : "Nouvelle Compétence"]);
    };

    const removeSkill = (category: string, index: number) => {
        const currentList = skillsMap[category] || [];
        const newList = [...currentList];
        newList.splice(index, 1);
        updateSkillList(category, newList);
    };

    const updateSkillName = (category: string, index: number, newName: string) => {
        const currentList = skillsMap[category] || [];
        const newList = [...currentList];
        newList[index] = newName;
        updateSkillList(category, newList);
    };

    // -- DnD Handlers --
    const handleDragStart = (e: React.DragEvent, category: string, index: number, name: string) => {
        const item: DragItem = { type: 'admin_sheet_skill', category, index, name };
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify(item));
    };

    const handleDropOnColumn = (e: React.DragEvent, targetCategory: string, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem) return;

        // 1. Reordering within/between Columns
        if (draggedItem.type === 'admin_sheet_skill') {
            const sourceCategory = draggedItem.category!;
            const sourceIndex = draggedItem.index!;

            const sourceList = [...(skillsMap[sourceCategory] || [])];
            const targetList = (sourceCategory === targetCategory)
                ? sourceList
                : [...(skillsMap[targetCategory] || [])];

            const [itemToMove] = sourceList.splice(sourceIndex, 1);

            if (targetIndex === -1 || targetIndex >= targetList.length) {
                targetList.push(itemToMove);
            } else {
                targetList.splice(targetIndex, 0, itemToMove);
            }

            const newDefinitions = { ...rules.definitions };
            newDefinitions.skills = { ...newDefinitions.skills };

            newDefinitions.skills[sourceCategory] = sourceList;
            if (sourceCategory !== targetCategory) {
                newDefinitions.skills[targetCategory] = targetList;
            }

            onUpdate({ ...rules, definitions: newDefinitions });
        }

        // 2. Mobile Library Drop
        else if (draggedItem.type === 'admin_lib_skill') {
            const skillName = draggedItem.name || draggedItem.data.name;
            const currentList = [...(skillsMap[targetCategory] || [])];

            if (currentList.includes(skillName)) {
                setDraggedItem(null);
                return;
            }

            if (targetIndex === -1 || targetIndex >= currentList.length) {
                currentList.push(skillName);
            } else {
                currentList.splice(targetIndex, 0, skillName);
            }

            updateSkillList(targetCategory, currentList);
        }

        setDraggedItem(null);
    };

    return (
        <div className="flex relative items-start gap-4">
            <div className="flex-grow space-y-8">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 flex justify-between items-start">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-blue-500 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-bold text-blue-900 text-sm">Gestion Dynamique</h3>
                            <p className="text-xs text-blue-700 mt-1">
                                Glissez-déposez pour réorganiser. Glissez vers la réserve (droite) pour archiver.
                                <br />Les nouvelles compétences sont automatiquement ajoutées à la bibliothèque.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSyncAll}
                        className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors font-bold flex items-center gap-2 shadow-sm"
                        title="Ajouter toutes les compétences actuelles à la bibliothèque"
                    >
                        {syncSuccess ? <CheckCircle2 size={14} className="text-green-600" /> : <FolderSync size={14} />}
                        {syncSuccess || "Synchroniser Bibliothèque"}
                    </button>
                </div>

                {/* Dynamic Columns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {disambiguateCategories(skillCategories).map(cat => (
                        <SkillCategoryCard
                            key={cat.id}
                            id={cat.id}
                            label={cat.label}
                            categoryConfig={skillCategories.find(c => c.id === cat.id)!}
                            skills={skillsMap[cat.id] || []}
                            isDraggingSidebarItem={draggedItem?.type === 'admin_lib_skill'}
                            onUpdateLabel={updateLabel}
                            onUpdateBehavior={updateBehavior}
                            onUpdateSkill={updateSkillName}
                            onAddSkill={addSkill}
                            onRemoveSkill={removeSkill}
                            onSkillBlur={handleSkillBlur}
                            onDragStart={(e, idx, name) => handleDragStart(e, cat.id, idx, name)}
                            onDrop={(e, idx) => handleDropOnColumn(e, cat.id, idx)}
                            draggedItemInfo={draggedItem}
                        />
                    ))}
                </div>
            </div>

            <AdminSkillLibrarySidebar
                rules={rules}
                onUpdate={onUpdate}
                draggedItem={draggedItem as any}
                setDraggedItem={setDraggedItem}
            />
        </div>
    );
};

export default AdminSkillsEditor;
