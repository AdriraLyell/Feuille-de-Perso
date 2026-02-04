import React, { useState } from 'react';
import { RulesData } from '../../types/rules';
import { Plus, Trash2, GripVertical, AlertCircle, Minus } from 'lucide-react';
import AdminSkillLibrarySidebar from './libraries/AdminSkillLibrarySidebar';

interface AdminSkillsEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

// Drag Types
type DragItem = { type: 'admin_sheet_skill' | 'admin_lib_skill', category?: string, index?: number, name?: string, data?: any };

const AdminSkillsEditor: React.FC<AdminSkillsEditorProps> = ({ rules, onUpdate }) => {
    const definitions = rules.definitions;
    const skillsMap = definitions.skills;
    const labelsMap = definitions.labels || {};
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

    // Safety check for categories structure
    const categories = Object.keys(skillsMap);

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
                labels: {
                    ...rules.definitions.labels,
                    [category]: newLabel
                }
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
    const handleDragStart = (e: React.DragEvent, type: 'admin_sheet_skill', payload: any) => {
        setDraggedItem({ type, ...payload });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify({ type, ...payload }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDropOnColumn = (e: React.DragEvent, targetCategory: string, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem) return;

        // 1. Reordering within/between Columns
        if (draggedItem.type === 'admin_sheet_skill') {
            const sourceCategory = draggedItem.category!;
            const sourceIndex = draggedItem.index!;

            // Get Lists
            const sourceList = [...(skillsMap[sourceCategory] || [])];
            const targetList = (sourceCategory === targetCategory)
                ? sourceList
                : [...(skillsMap[targetCategory] || [])];

            // Remove from source
            const [itemToMove] = sourceList.splice(sourceIndex, 1);

            // Insert into target (handle boundaries)
            // If dropping on container (targetIndex undefined or similar logic needed if container drop)
            // But here targetIndex comes from list mapping, so it's precise.
            // If dragging to end, targetIndex might be length
            if (targetIndex === -1 || targetIndex >= targetList.length) {
                targetList.push(itemToMove);
            } else {
                targetList.splice(targetIndex, 0, itemToMove);
            }

            // Update State
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

            // Avoid duplicates
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

    const renderColumn = (category: string) => {
        const list = skillsMap[category] || [];
        const label = labelsMap[category] || category;
        const isDraggingOver = draggedItem?.type === 'admin_lib_skill';

        return (
            <div
                key={category}
                className={`flex flex-col h-full bg-[#fdfbf7]/80 backdrop-blur-sm p-4 rounded-sm shadow-md border transition-all duration-300 ${isDraggingOver ? 'border-dashed border-amber-400 bg-amber-50/50 scale-[1.01]' : 'border-[#bfae85]/30'}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnColumn(e, category, list.length)}
            >
                {/* HEADERS MATCHING PLAYER SETTINGS STYLE EXACTLY (Inset) */}
                <h3 className="font-bold text-[10px] mb-4 text-[#5c4d41] border-b border-[#bfae85]/30 pb-2 flex justify-between items-center select-none uppercase tracking-widest">
                    <div className="flex-grow">
                        <input
                            value={label}
                            onChange={(e) => updateLabel(category, e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-[#5c4d41] placeholder:text-[#bfae85] focus:text-[#8b2e2e] rounded hover:bg-[#bfae85]/10 transition-colors cursor-text"
                            placeholder={category.toUpperCase()}
                            title="Renommer la catégorie"
                        />
                    </div>

                    <div className="flex gap-1 ml-2">
                        <button
                            onClick={() => addSkill(category, true)}
                            className="text-[9px] bg-stone-500 text-white px-2 py-1 rounded-sm flex items-center gap-1 hover:bg-stone-600 transition-colors font-bold shadow-sm"
                            title="Ajouter un espaceur"
                        >
                            <Minus size={10} />
                        </button>
                        <button
                            onClick={() => addSkill(category)}
                            className="text-[9px] bg-[#166534] text-white px-2 py-1 rounded-sm flex items-center gap-1 hover:bg-[#114b27] transition-colors font-bold shadow-sm"
                            title="Ajouter"
                        >
                            <Plus size={10} />
                        </button>
                    </div>
                </h3>

                <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[500px] min-h-[50px]">
                    {list.length === 0 && (
                        <div className="h-16 border-2 border-dashed border-[#bfae85]/30 rounded-sm flex items-center justify-center text-[#5c4d41]/40 text-[10px] pointer-events-none italic">
                            Zone de dépôt
                        </div>
                    )}

                    {list.map((skillName, index) => {
                        const isDragging = draggedItem?.type === 'admin_sheet_skill' && draggedItem?.index === index && draggedItem?.category === category;

                        return (
                            <div
                                key={index}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, 'admin_sheet_skill', { category, index, name: skillName })}
                                onDragOver={handleDragOver}
                                onDrop={(e) => { e.stopPropagation(); handleDropOnColumn(e, category, index); }}
                                className={`flex items-center gap-2 group transition-all duration-200 p-1 rounded-sm ${isDragging ? 'opacity-50 bg-[#bfae85]/10' : 'hover:bg-[#bfae85]/5'}`}
                            >
                                <div className="cursor-grab text-[#bfae85]/40 hover:text-[#8b2e2e] active:cursor-grabbing p-1 transition-colors">
                                    <GripVertical size={16} />
                                </div>
                                <span className="text-[#5c4d41]/30 text-[9px] w-4 text-center select-none font-mono">{index + 1}</span>

                                {skillName === "" ? (
                                    <div className="flex-grow h-7 bg-black/5 border border-dashed border-[#bfae85]/30 rounded-sm flex items-center justify-center text-[10px] text-[#5c4d41]/40 italic cursor-grab select-none">
                                        Espaceur
                                    </div>
                                ) : (
                                    <input
                                        value={skillName}
                                        onChange={(e) => updateSkillName(category, index, e.target.value)}
                                        className="border border-[#bfae85]/30 p-1 rounded-sm w-full focus:border-[#8b2e2e] outline-none bg-white/50 text-xs font-bold text-[#2c241b] transition-all shadow-sm"
                                    />
                                )}
                                <button
                                    onClick={() => removeSkill(category, index)}
                                    className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 p-1"
                                    title="Archiver"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex relative items-start gap-4">
            <div className="flex-grow space-y-8"> {/* Main Content */}

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-blue-500 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-bold text-blue-900 text-sm">Gestion Dynamique</h3>
                            <p className="text-xs text-blue-700 mt-1">
                                Glissez-déposez pour réorganiser. Glissez vers la réserve (droite) pour archiver.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ROW 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderColumn("talents")}
                    {renderColumn("competences")}
                    {renderColumn("competences_col_2")}
                    {renderColumn("connaissances")}
                </div>

                {/* ROW 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderColumn("autres_competences")}
                    {renderColumn("competences2")}
                    {renderColumn("autres")}
                    {renderColumn("arrieres_plans")}
                </div>

                {/* ROW 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderColumn("counters")}
                </div>

            </div>

            {/* Sidebar */}
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
