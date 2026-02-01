
import { useCharacter } from '../context/CharacterContext';
import { CharacterSheetData, DotEntry, SkillCategoryKey } from '../types';
import SpecializationOmnibar from './specialization-library/SpecializationOmnibar';
import SpecializationLibraryDrawer from './specialization-library/SpecializationLibraryDrawer';
import { Award, Book } from 'lucide-react';
import { useState } from 'react';

interface Props {
    isLandscape?: boolean;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="bg-slate-200 text-slate-800 text-center font-bold text-xs border-y border-stone-500 uppercase py-0.5 mt-3 mb-2 tracking-wide shadow-sm rounded-sm">
        {title}
    </div>
);

const CharacterSheetSpecializations: React.FC<Props> = ({ isLandscape = false }) => {
    const { data, updateData: onChange, addLog: onAddLog } = useCharacter();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

    const handleDrop = (e: React.DragEvent, skillId: string) => {
        e.preventDefault();
        try {
            const dragData = e.dataTransfer.getData('application/json');
            if (dragData) {
                const { name } = JSON.parse(dragData);
                if (name) {
                    // Find first empty slot
                    const skill = findSkill(skillId);
                    if (!skill) return;

                    const userSpecs = data.specializations[skillId] || [];
                    const firstEmptyIndex = Array.from({ length: skill.value }).findIndex((_, i) => !userSpecs[i]);

                    if (firstEmptyIndex !== -1) {
                        updateSpecialization(skillId, firstEmptyIndex, name);
                    } else {
                        // All slots full? Maybe add to the last one or do nothing
                        onAddLog(`Plus d'emplacement disponible pour ${skill.name}`, 'danger', 'sheet');
                    }
                }
            }
        } catch (err) {
            console.error("Drop failed", err);
        }
    };

    const findSkill = (skillId: string): DotEntry | null => {
        for (const cat of Object.keys(data.skills)) {
            // @ts-ignore
            const skill = data.skills[cat].find((s: DotEntry) => s.id === skillId);
            if (skill) return skill;
        }
        return null;
    };

    const renderSkillBox = (skill: DotEntry) => {
        // Determine how many inputs to show based on dot value
        const count = skill.value;
        // We check if there are imposed specializations OR if there are dots
        // GLOBAL FIX: Skill must be > 0 for ANY specialization to appear
        const imposedSpecs = skill.value > 0
            ? (data.imposedSpecializations[skill.id] || []).filter(spec => skill.value >= (spec.minLevel || 0))
            : [];

        if (count <= 0 && imposedSpecs.length === 0) return null;

        const userSpecs = data.specializations[skill.id] || [];

        return (
            <div
                key={skill.id}
                className="border border-stone-400 p-1 bg-white break-inside-avoid shadow-sm flex flex-col gap-0.5 rounded-sm group/skill hover:border-amber-300 transition-colors"
                onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-amber-50');
                }}
                onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-amber-50');
                }}
                onDrop={(e) => {
                    e.currentTarget.classList.remove('bg-amber-50');
                    handleDrop(e, skill.id);
                }}
            >
                <div className="font-bold text-[10px] border-b border-stone-300 mb-0.5 flex justify-between bg-stone-50 px-1 items-center text-stone-700 group-hover/skill:bg-amber-50 transition-colors">
                    <span className="truncate" title={skill.name}>{skill.name}</span>
                    <span className="text-stone-400 text-[9px] ml-1">({count})</span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    {/* Render Imposed Specializations first (Read Only) */}
                    {imposedSpecs.map((spec, i) => (
                        <input
                            key={`imposed-${i}`}
                            className="w-full bg-slate-100 border-b border-dotted border-stone-300 text-[10px] h-4 px-1 font-bold text-slate-700 focus:outline-none cursor-default font-handwriting"
                            value={spec.name}
                            readOnly
                            title={`Spécialisation imposée (Niveau requis : ${spec.minLevel || 0})`}
                        />
                    ))}

                    {/* Render User Specializations (Count based on dots) */}
                    {Array.from({ length: count }).map((_, i) => (
                        <SpecializationOmnibar
                            key={`user-${i}`}
                            value={userSpecs[i] || ''}
                            onChange={(val) => updateSpecialization(skill.id, i, val)}
                            skillId={skill.id}
                            className="w-full"
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
            // GLOBAL FIX: If skill value is 0, we don't show it (no specs visible at 0)
            return s.value > 0;
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
            const hasVisibleImposed = (data.imposedSpecializations[s.id] || [])
                .some(spec => s.value >= (spec.minLevel || 0));
            return hasDots || hasVisibleImposed;
        });
    });

    return (
        <div className={`sheet-container p-6 ${isLandscape ? 'landscape' : ''}`}>

            <h1 className="text-3xl font-black text-center uppercase py-2 tracking-widest border-b-2 border-stone-800 mb-4 text-indigo-950 font-serif relative">
                Spécialisations
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold py-1 px-3 rounded shadow-sm transition-colors flex items-center gap-1 uppercase"
                >
                    <Award size={14} /> Catalogue
                </button>
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

            <SpecializationLibraryDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
        </div>
    );
};

export default CharacterSheetSpecializations;
