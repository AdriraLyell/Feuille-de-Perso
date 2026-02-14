import React, { useState } from 'react';
import { RulesData, SkillCategoryConfig } from '../../types/rules';
import { LibrarySkillEntry, DotEntry } from '../../types';
import { disambiguateCategories } from '../../utils/categoryUtils';
import AdminSkillLibrarySidebar from './libraries/AdminSkillLibrarySidebar';
import SkillCategoryCard from './skills/SkillCategoryCard';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { useSkillEditorActions } from '../hooks/useSkillEditorActions';
import { SkillEditorHeader } from './skills/SkillEditorHeader';

interface AdminSkillsEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

export type DragItem = {
    type: 'admin_sheet_skill' | 'admin_lib_skill';
    category?: string;
    index?: number;
    name?: string;
    data?: LibrarySkillEntry | DotEntry;
};

const AdminSkillsEditor: React.FC<AdminSkillsEditorProps> = ({ rules, onUpdate }) => {
    const definitions = rules.definitions;
    const skillsMap = definitions.skills || {};
    const skillCategories = definitions.skillCategories || [];
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

    const {
        syncSuccess,
        handleSyncAll,
        updateLabel,
        updateBehavior,
        updateCategoryMetadata,
        updateSkillName,
        addSkill,
        removeSkill,
        handleSkillBlur,
        updateSkillList
    } = useSkillEditorActions(rules, onUpdate);

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
            const skillName = draggedItem.name || draggedItem.data?.name || 'Inconnu';
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
                <SkillEditorHeader
                    handleSyncAll={handleSyncAll}
                    syncSuccess={syncSuccess}
                />

                {/* Dynamic Columns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {disambiguateCategories(skillCategories).map((cat, index) => (
                        <MotionFade key={cat.id} delay={0.1 + (index * 0.05)}>
                            <SkillCategoryCard
                                id={cat.id}
                                label={cat.label}
                                categoryConfig={skillCategories.find(c => c.id === cat.id)!}
                                skills={skillsMap[cat.id] || []}
                                isDraggingSidebarItem={draggedItem?.type === 'admin_lib_skill'}
                                onUpdateLabel={updateLabel}
                                onUpdateBehavior={updateBehavior}
                                onUpdateCategory={(updates: Partial<SkillCategoryConfig>) => updateCategoryMetadata(cat.id, updates)}
                                onUpdateSkill={updateSkillName}
                                onAddSkill={addSkill}
                                onRemoveSkill={removeSkill}
                                onSkillBlur={handleSkillBlur}
                                onDragStart={(e, idx, name) => handleDragStart(e, cat.id, idx, name)}
                                onDrop={(e, idx) => handleDropOnColumn(e, cat.id, idx)}
                                draggedItemInfo={draggedItem}
                            />
                        </MotionFade>
                    ))}
                </div>
            </div>

            <AdminSkillLibrarySidebar
                rules={rules}
                onUpdate={onUpdate}
                draggedItem={draggedItem}
                setDraggedItem={setDraggedItem}
            />
        </div>
    );
};

export default AdminSkillsEditor;
