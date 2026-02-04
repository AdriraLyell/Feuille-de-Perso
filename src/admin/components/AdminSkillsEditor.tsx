import React, { useState } from 'react';
import { RulesData } from '../../types/rules';
import { Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
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

    const addSkill = (category: string) => {
        const currentList = skillsMap[category] || [];
        updateSkillList(category, [...currentList, "Nouvelle Compétence"]);
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

    const handleDropOnColumn = (e: React.DragEvent, category: string) => {
        e.preventDefault();
        if (!draggedItem) return;

        if (draggedItem.type === 'admin_lib_skill') {
            // Add from Library
            const skillName = draggedItem.name || draggedItem.data.name;
            const currentList = skillsMap[category] || [];

            // Check existence
            if (currentList.includes(skillName)) return;

            updateSkillList(category, [...currentList, skillName]);
        }

        // Reordering within same category (Optional, currently simplified)

        setDraggedItem(null);
    };

    const renderColumn = (category: string) => {
        const list = skillsMap[category] || [];
        const label = labelsMap[category] || category;

        const isDropTarget = draggedItem?.type === 'admin_lib_skill';

        return (
            <div
                key={category}
                className={`flex flex-col h-[500px] bg-white p-4 rounded shadow-sm border transition-colors ${isDropTarget ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnColumn(e, category)}
            >
                {/* Header with Editable Label */}
                <div className="mb-4 border-b border-slate-200 pb-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Catégorie (ID: {category})</label>
                    <div className="flex items-center gap-2">
                        <input
                            value={label}
                            onChange={(e) => updateLabel(category, e.target.value)}
                            className="font-bold text-sm bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none w-full text-slate-800"
                        />
                        <button
                            onClick={() => addSkill(category)}
                            className="bg-green-600 text-white p-1 rounded hover:bg-green-700 transition-colors shadow-sm"
                            title="Ajouter une compétence"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            onClick={() => updateSkillList(category, [...(skillsMap[category] || []), ""])}
                            className="bg-slate-200 text-slate-600 p-1 rounded hover:bg-slate-300 transition-colors shadow-sm"
                            title="Ajouter un espaceur (séparateur)"
                        >
                            <GripVertical size={14} />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-grow overflow-y-auto pr-2 space-y-2 custom-scrollbar relative">
                    {/* Visual Hint for Drop */}
                    {isDropTarget && (
                        <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center pointer-events-none border-2 border-dashed border-blue-200 rounded m-1">
                            <span className="text-blue-600 font-bold bg-white/80 px-2 py-1 rounded">Ajouter ici</span>
                        </div>
                    )}

                    {list.map((skillName, index) => (
                        <div
                            key={index}
                            draggable={skillName !== ""}
                            onDragStart={(e) => handleDragStart(e, 'admin_sheet_skill', { category, index, name: skillName })}
                            className="flex items-center gap-2 group p-1 hover:bg-slate-50 rounded cursor-grab active:cursor-grabbing"
                        >
                            <span className="text-[10px] text-slate-300 font-mono w-4">{index + 1}</span>
                            {skillName === "" ? (
                                <div className="flex-grow h-6 flex items-center justify-center bg-slate-100 rounded border border-slate-200 cursor-not-allowed" title="Espaceur (Séparateur)">
                                    <div className="h-0.5 w-full bg-slate-300 mx-2"></div>
                                </div>
                            ) : (
                                <input
                                    value={skillName}
                                    onChange={(e) => updateSkillName(category, index, e.target.value)}
                                    className="flex-grow text-xs font-medium border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-1 py-0.5 outline-none bg-transparent focus:bg-white transition-all text-slate-700"
                                />
                            )}
                            <button
                                onClick={() => removeSkill(category, index)}
                                className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                                title="Supprimer"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {list.length === 0 && (
                        <div className="text-center italic text-xs text-slate-400 py-4">
                            Aucune compétence
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex relative">
            <div className="flex-grow pr-80 p-1"> {/* Spacing for Sidebar */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-blue-500 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-bold text-blue-900 text-sm">Gestion Dynamique</h3>
                            <p className="text-xs text-blue-700 mt-1">
                                Glissez-déposez des compétences depuis la réserve (à droite) pour les ajouter.
                                Glissez une compétence vers la réserve pour l'archiver.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {categories.map(cat => renderColumn(cat))}
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
