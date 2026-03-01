
import React, { useState } from 'react';
import { CharacterSheetData, DotEntry, SkillCategoryKey } from '../../types';
import { Plus, Trash2, Award } from 'lucide-react';
import SpecializationOmnibar from '../specialization-library/SpecializationOmnibar';
import { ErrorService } from '../../services/ErrorService';

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
      const list = data.skills[cat];
      if (Array.isArray(list)) {
        const found = list.find(s => s.id === skillId);
        if (found) return { name: found.name };
      }
    }
    return { name: "Inconnu" };
  };

  const updateSpecialization = (skillId: string, index: number, field: 'name' | 'minLevel', value: string | number) => {
    const currentSpecs = data.imposedSpecializations[skillId] || [];
    const newSpecs = [...currentSpecs];
    newSpecs[index] = { ...newSpecs[index], [field]: value };

    onUpdate({
      ...data,
      imposedSpecializations: {
        ...data.imposedSpecializations,
        [skillId]: newSpecs
      }
    });
  };

  const syncSpecializationWithLibrary = (skillId: string, name: string, minLevel: number) => {
    if (name.trim() === '') return;

    const newLibrary = [...(data.specializationLibrary || [])];
    const normName = name.trim().toLowerCase();
    const existingIdx = newLibrary.findIndex(l => l.name.trim().toLowerCase() === normName);

    if (existingIdx !== -1) {
      const entry = newLibrary[existingIdx];
      const skillIds = entry.skillIds || [];
      if (!skillIds.includes(skillId)) {
        newLibrary[existingIdx] = {
          ...entry,
          skillIds: [...skillIds, skillId]
        };
        onUpdate({ ...data, specializationLibrary: newLibrary });
      }
    } else {
      newLibrary.push({
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        skillIds: [skillId],
        defaultMinLevel: minLevel || 0,
        description: ''
      });
      newLibrary.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate({ ...data, specializationLibrary: newLibrary });
    }
  };

  const addSpecialization = (skillId: string) => {
    const currentSpecs = data.imposedSpecializations[skillId] || [];
    const newSpec = { name: "", minLevel: 0 };
    const newSpecs = [...currentSpecs, newSpec];

    onUpdate({
      ...data,
      imposedSpecializations: {
        ...data.imposedSpecializations,
        [skillId]: newSpecs
      }
    });
    setNewlyAddedSpec({ skillId, index: currentSpecs.length });
    const { name } = getSkillContext(skillId);
    onAddLog(`Ajout : Spécialisation automatique pour "${name}"`, 'success', 'settings');
  };

  const removeSpecialization = (skillId: string, index: number) => {
    const currentSpecs = data.imposedSpecializations[skillId] || [];
    const specName = currentSpecs[index]?.name || '(vide)';
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

  const handleDrop = (e: React.DragEvent, skillId: string) => {
    e.preventDefault();
    try {
      const dragData = e.dataTransfer.getData('application/json');
      if (dragData) {
        const { name, minLevel } = JSON.parse(dragData);
        if (name) {
          const currentSpecs = data.imposedSpecializations[skillId] || [];
          const newSpecs = [...currentSpecs, { name, minLevel: minLevel || 1 }];
          onUpdate({
            ...data,
            imposedSpecializations: {
              ...data.imposedSpecializations,
              [skillId]: newSpecs
            }
          });
          const { name: skillName } = getSkillContext(skillId);
          onAddLog(`Ajout (via catalogue) : "${name}" pour "${skillName}"`, 'success', 'settings');
        }
      }
    } catch (err) {
      ErrorService.handleError(err, { context: 'SpecializationsEditor.Drop', silent: true });
    }
  };

  const renderSpecializationEditor = (title: string, category: string) => {
    // Migration safety: support both legacy and new category keys
    const legacyToNew: Record<string, string> = {
      'talents': 'Col_Comp_1',
      'competences': 'Col_Comp_2',
      'competences_col_2': 'Col_Comp_3',
      'connaissances': 'Col_Comp_4',
      'autres_competences': 'Col_Comp_5',
      'autres': 'Col_Comp_7',
      'arrieres_plans': 'Col_Comp_8'
    };

    const list: DotEntry[] = data.skills[category] || (legacyToNew[category] ? data.skills[legacyToNew[category]] : []) || [];

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
              <div
                key={skill.id}
                className="border border-gray-200 rounded p-2.5 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group/skill"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('bg-amber-50');
                  e.currentTarget.classList.add('border-amber-300');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-amber-50');
                  e.currentTarget.classList.remove('border-amber-300');
                }}
                onDrop={(e) => {
                  e.currentTarget.classList.remove('bg-amber-50');
                  e.currentTarget.classList.remove('border-amber-300');
                  handleDrop(e, skill.id);
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-gray-700">{skill.name}</span>
                  <button
                    onClick={() => addSpecialization(skill.id)}
                    className="text-[10px] bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 transition-colors font-bold shadow-sm opacity-0 group-hover/skill:opacity-100"
                  >
                    <Plus size={10} /> Ajouter
                  </button>
                </div>

                {imposedSpecs.length === 0 && (
                  <div className="text-[10px] text-gray-400 italic px-1 pb-1">
                    Aucune spécialisation automatique.
                  </div>
                )}

                <div className="space-y-1.5">
                  {imposedSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 ml-1"></div>
                      <SpecializationOmnibar
                        value={spec.name}
                        onChange={(val) => updateSpecialization(skill.id, idx, 'name', val)}
                        onBlur={(val) => syncSpecializationWithLibrary(skill.id, val, spec.minLevel)}
                        onSelect={(entry) => updateSpecialization(skill.id, idx, 'minLevel', entry.defaultMinLevel)}
                        skillId={skill.id}
                        className="flex-grow"
                        placeholder="Spécialisation..."
                      />
                      <div className="flex items-center bg-white border border-gray-300 rounded px-1 h-[26px] shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 mr-1 uppercase">Seuil</span>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={spec.minLevel || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateSpecialization(skill.id, idx, 'minLevel', val);
                            syncSpecializationWithLibrary(skill.id, spec.name, val);
                          }}
                          className="w-6 text-center text-xs font-bold text-blue-600 outline-none bg-transparent"
                          title="Niveau minimum requis dans la compétence"
                        />
                      </div>
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
