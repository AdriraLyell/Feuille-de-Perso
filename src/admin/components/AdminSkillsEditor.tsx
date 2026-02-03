import React, { useState } from 'react';
import { RulesData } from '../../types/rules';
import { Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';

interface AdminSkillsEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminSkillsEditor: React.FC<AdminSkillsEditorProps> = ({ rules, onUpdate }) => {
    const definitions = rules.definitions;
    const skillsMap = definitions.skills;
    const labelsMap = definitions.labels || {};

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

    const renderColumn = (category: string) => {
        const list = skillsMap[category] || [];
        const label = labelsMap[category] || category;

        return (
            <div key={category} className="bg-white p-4 rounded shadow-sm border border-slate-200 flex flex-col h-[500px]">
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
                <div className="flex-grow overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {list.map((skillName, index) => (
                        <div key={index} className="flex items-center gap-2 group p-1 hover:bg-slate-50 rounded">
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
        <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-500 mt-0.5" size={20} />
                    <div>
                        <h3 className="font-bold text-blue-900 text-sm">Gestion Dynamique</h3>
                        <p className="text-xs text-blue-700 mt-1">
                            Ces listes définissent les compétences disponibles pour tout nouveau personnage.
                            Vous pouvez renommer les catégories (affichées en haut de colonne) et le contenu.
                            L'ID technique de la catégorie (ex: 'talents') reste fixe pour assurer la compatibilité.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map(cat => renderColumn(cat))}
            </div>
        </div>
    );
};

export default AdminSkillsEditor;
