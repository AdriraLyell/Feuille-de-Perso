
import React, { useState } from 'react';
import { CharacterSheetData, DotEntry, SkillCategoryKey } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface SpecializationsEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

const SpecializationsEditor: React.FC<SpecializationsEditorProps> = ({ data, onUpdate, onAddLog }) => {
    const [newlyAddedSpec, setNewlyAddedSpec] = useState<{ skillId: string; index: number } | null>(null);

    const getSkillContext = (skillId: string) => {
        if (!data.skills) return { name: "Inconnu" };
        for (const cat of Object.keys(data.skills)) {
            // @ts-ignore
            const list = data.skills[cat];
            if (Array.isArray(list)) {
                const found = list.find(s => s.id === skillId);
                if (found) return { name: found.name };
            }
        }
        return { name: "Inconnu" };
    };

    const updateSpecialization = (skillId: string, index: number, value: string) => {
        const currentSpecs = data.imposedSpecializations[skillId] || [];
        const newSpecs = [...currentSpecs];
        newSpecs[index] = value;
        onUpdate({
            ...data,
            imposedSpecializations: {
                ...data.imposedSpecializations,
                [skillId]: newSpecs
            }
        });
    };

    const addSpecialization = (skillId: string) => {
        const currentSpecs = data.imposedSpecializations[skillId] || [];
        const newSpecs = [...currentSpecs, ""];
        onUpdate({
            ...data,
            imposedSpecializations: {
                ...data.imposedSpecializations,
                [skillId]: newSpecs
            }
        });
        setNewlyAddedSpec({ skillId, index: currentSpecs.length });
        const { name } = getSkillContext(skillId);
        onAddLog(`Ajout : Spécialisation pour "${name}"`, 'success', 'settings');
    };

    const removeSpecialization = (skillId: string, index: number) => {
        const currentSpecs = data.imposedSpecializations[skillId] || [];
        const specName = currentSpecs[index];
        const newSpecs = currentSpecs.filter((_, i) => i !== index);
        onUpdate({
            ...data,
            imposedSpecializations: {
                ...data.imposedSpecializations,
                [skillId]: newSpecs
            }
        });
        const { name } = getSkillContext(skillId);
        onAddLog(`Suppression : Spécialisation "${specName || '(vide)'}" pour "${name}"`, 'danger', 'settings');
    };

    const renderSpecializationEditor = (title: string, category: string) => {
        // @ts-ignore
        const list: DotEntry[] = data.skills[category] || [];

        return (
          <div className="bg-white p-4 rounded shadow flex flex-col h-full animate-in fade-in duration-300">
            <h3 className="font-bold text-sm mb-4 text-gray-800 border-b pb-2 flex items-center justify-between">
              {title}
            </h3>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 max-h-[500px] custom-scrollbar">
              {list.length === 0 && (
                <div className="text-center text-gray-400 text-xs italic py-4 border-2 border-dashed border-gray-100 rounded">
                  Aucune compétence.
                </div>
              )}
              {list.map((skill) => {
                const imposedSpecs = data.imposedSpecializations[skill.id] || [];
                
                // Skip spacers (empty names)
                if (!skill.name) return null;

                return (
                  <div key={skill.id} className="border border-gray-200 rounded p-2.5 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-gray-700">{skill.name}</span>
                      <button
                        onClick={() => addSpecialization(skill.id)}
                        className="text-[10px] bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 transition-colors font-bold shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <Plus size={10} /> Ajouter
                      </button>
                    </div>
                    
                    {imposedSpecs.length === 0 && (
                      <div className="text-[10px] text-gray-400 italic px-1 pb-1">
                        Aucune spécialisation imposée.
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {imposedSpecs.map((spec, idx) => (
                        <div key={idx} className="flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 ml-1"></div>
                          <input
                            type="text"
                            autoFocus={newlyAddedSpec?.skillId === skill.id && newlyAddedSpec?.index === idx}
                            value={spec}
                            placeholder="Nom de la spécialisation"
                            onChange={(e) => updateSpecialization(skill.id, idx, e.target.value)}
                            onBlur={() => setNewlyAddedSpec(null)}
                            className="flex-grow text-xs border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none bg-white focus:ring-1 focus:ring-blue-200 transition-shadow"
                          />
                          <button
                            onClick={() => removeSpecialization(skill.id, idx)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
             <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderSpecializationEditor("Talents (Col 1)", "talents")}
                    {renderSpecializationEditor("Compétences (Col 2)", "competences")}
                    {renderSpecializationEditor("Compétences (Col 3)", "competences_col_2")}
                    {renderSpecializationEditor("Connaissances (Col 4)", "connaissances")}
                </div>
             </div>
             <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderSpecializationEditor("Autres Compétences", "autres_competences")}
                    {renderSpecializationEditor("Autres", "autres")}
                </div>
             </div>
        </div>
    );
};

export default SpecializationsEditor;
