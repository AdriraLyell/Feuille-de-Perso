
import React from 'react';
import { CharacterSheetData, DotEntry, SkillCategoryKey } from '../types';

interface Props {
  data: CharacterSheetData;
  onChange: (newData: CharacterSheetData) => void;
  isLandscape?: boolean;
  onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-slate-200 text-slate-800 text-center font-bold text-xs border-y border-stone-500 uppercase py-0.5 mt-3 mb-2 tracking-wide shadow-sm rounded-sm">
    {title}
  </div>
);

const CharacterSheetSpecializations: React.FC<Props> = ({ data, onChange, isLandscape = false, onAddLog }) => {

  const getSkillName = (skillId: string): string => {
      for (const cat of Object.keys(data.skills)) {
          // @ts-ignore
          const skill = data.skills[cat].find((s: DotEntry) => s.id === skillId);
          if (skill) return skill.name;
      }
      return 'Compétence';
  };

  const updateSpecialization = (skillId: string, index: number, value: string) => {
    const currentSpecs = data.specializations[skillId] || [];
    const newSpecs = [...currentSpecs];
    // Pad array if needed
    if (newSpecs.length <= index) {
        // Fill gaps with empty strings
        for (let i = newSpecs.length; i <= index; i++) {
            newSpecs[i] = "";
        }
    }
    newSpecs[index] = value;

    onChange({
        ...data,
        specializations: {
            ...data.specializations,
            [skillId]: newSpecs
        }
    });

    const skillName = getSkillName(skillId);
    onAddLog(`Spécialisation modifiée (${skillName}) : ${value}`, 'info', 'sheet', `spec_${skillId}_${index}`);
  };

  const renderSkillBox = (skill: DotEntry) => {
    // Determine how many inputs to show based on dot value
    const count = skill.value;
    // We check if there are imposed specializations OR if there are dots
    const imposedSpecs = data.imposedSpecializations[skill.id] || [];
    
    if (count <= 0 && imposedSpecs.length === 0) return null;

    const userSpecs = data.specializations[skill.id] || [];

    return (
        <div key={skill.id} className="border border-stone-400 p-1 bg-white break-inside-avoid shadow-sm flex flex-col gap-0.5 rounded-sm">
            <div className="font-bold text-[10px] border-b border-stone-300 mb-0.5 flex justify-between bg-stone-50 px-1 items-center text-stone-700">
                <span className="truncate" title={skill.name}>{skill.name}</span>
                <span className="text-stone-400 text-[9px] ml-1">({count})</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                {/* Render Imposed Specializations first (Read Only) */}
                {imposedSpecs.map((spec, i) => (
                     <input
                        key={`imposed-${i}`}
                        className="w-full bg-slate-100 border-b border-dotted border-stone-300 text-[10px] h-4 px-1 font-bold text-slate-700 focus:outline-none cursor-default font-handwriting"
                        value={spec}
                        readOnly
                        title="Spécialisation imposée"
                    />
                ))}

                {/* Render User Specializations (Count based on dots) */}
                {Array.from({ length: count }).map((_, i) => (
                    <input
                        key={`user-${i}`}
                        className="w-full bg-transparent border-b border-dotted border-stone-300 text-[10px] h-4 px-1 font-handwriting text-ink focus:bg-blue-50 focus:border-blue-500 focus:outline-none transition-colors placeholder-stone-300"
                        placeholder={`Spec ${i + 1}`}
                        value={userSpecs[i] || ''}
                        onChange={(e) => updateSpecialization(skill.id, i, e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );
  };

  const renderCategory = (title: string, categoryKey: SkillCategoryKey) => {
      // Show skill if it has dots OR imposed specializations
      const skills = data.skills[categoryKey].filter(s => {
          if (s.name.trim() === '') return false; // Skip spacers
          const hasImposed = data.imposedSpecializations[s.id] && data.imposedSpecializations[s.id].length > 0;
          return s.value > 0 || hasImposed;
      });
      
      if (skills.length === 0) return null;

      // Adapt columns based on landscape mode (6 for portrait, 8 for landscape)
      const gridClass = isLandscape 
        ? "grid grid-cols-8 gap-1"
        : "grid grid-cols-6 gap-1";

      return (
          <div className="mb-1 break-inside-avoid">
              <SectionHeader title={title} />
              <div className="grid grid-cols-6 gap-2">
                  {skills.map(renderSkillBox)}
              </div>
          </div>
      );
  };

  // Check if there are any skills with values to display default message
  const hasAnySkill = Object.keys(data.skills).some(key => {
      if (key === 'arrieres_plans') return false; 
      if (key === 'competences2') return false; // Exclude secondary skills from empty check
      // Check for dots OR imposed specs
      // @ts-ignore
      return data.skills[key].some((s: DotEntry) => {
          const hasDots = s.value > 0;
          const hasImposed = data.imposedSpecializations[s.id] && data.imposedSpecializations[s.id].length > 0;
          return hasDots || hasImposed;
      });
  });

  return (
    <div className={`sheet-container p-6 ${isLandscape ? 'landscape' : ''}`}>
        
        <h1 className="text-3xl font-black text-center uppercase py-2 tracking-widest border-b-2 border-stone-800 mb-4 text-indigo-950 font-serif">
            Spécialisations
        </h1>

        <div className="flex-grow flex flex-col overflow-hidden">
            {!hasAnySkill && (
                <div className="text-center text-stone-400 italic mt-20 flex-grow flex items-center justify-center">
                    <div>
                        <p className="mb-2 text-lg">Aucune compétence (principale) ne possède de point ou de spécialisation imposée.</p>
                        <p className="text-sm">Ajoutez des points dans l'onglet "Personnage" pour voir apparaître les champs de spécialisation ici.</p>
                    </div>
                </div>
            )}

            <div className="space-y-0.5 overflow-auto">
                {renderCategory("Talents", "talents")}
                {renderCategory("Compétences", "competences")}
                {renderCategory("Compétences (Suite)", "competences_col_2")}
                {renderCategory("Connaissances", "connaissances")}
                {renderCategory("Autres Compétences", "autres_competences")}
                {/* Excluded Compétences Secondaires */}
                {renderCategory("Autres", "autres")}
            </div>
        </div>
    </div>
  );
};

export default CharacterSheetSpecializations;
