
import { useCharacter } from '../context/CharacterContext';
import { CharacterSheetData, DotEntry, SkillCategoryKey } from '../types';
import SpecializationOmnibar from './specialization-library/SpecializationOmnibar';
import SpecializationLibraryDrawer from './specialization-library/SpecializationLibraryDrawer';
import { Award, Book, Plus } from 'lucide-react';
import { useState } from 'react';
import { useRules } from '../context/RulesContext';
import { ErrorService } from '../services/ErrorService';
import { createDotEntry } from '../utils/factories';

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
    const { rules } = useRules();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const getSkillName = (skillId: string): string => {
        for (const cat of Object.keys(data.skills)) {
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

    const handlePromote = (skillId: string, index: number, specName: string) => {
        try {
            if (!specName || specName.trim() === '') return;

            // 1. Identifier la catégorie cible "Secondaire"
            const secondaryCat = rules?.definitions?.skillCategories?.find((cat: any) => cat.behavior === 'Secondaire' || cat.label.toLowerCase().includes('secondaire'))?.id || 'competences_secondaires';

            // 2. Vérifier si la compétence n'existe pas déjà
            const existingSkills = data.skills[secondaryCat] || [];
            const isDuplicate = existingSkills.some(s => s.name.trim().toLowerCase() === specName.trim().toLowerCase());

            if (isDuplicate) {
                onAddLog(`La compétence secondaire "${specName}" existe déjà.`, 'danger', 'sheet');
                return;
            }

            console.log(`[Promotion] Promouvoir "${specName}" vers ${secondaryCat} (Skill ID: ${skillId}, Index: ${index})`);

            // 3. Créer la nouvelle compétence (valeur 0 comme demandé)
            const newSkill = createDotEntry(specName, 0);

            // 4. Mettre à jour les données de manière fonctionnelle pour éviter tout souci de synchronisation
            onChange((prev: CharacterSheetData) => {
                const currentSpecs = prev.specializations[skillId] || [];
                const newSpecs = [...currentSpecs];
                newSpecs[index] = ""; // Libère l'emplacement

                const currentCatSkills = prev.skills[secondaryCat] || [];

                return {
                    ...prev,
                    skills: {
                        ...prev.skills,
                        [secondaryCat]: [...currentCatSkills, newSkill]
                    },
                    specializations: {
                        ...prev.specializations,
                        [skillId]: newSpecs
                    }
                };
            });

            onAddLog(`Spécialisation "${specName}" promue en compétence secondaire.`, 'success', 'sheet');
        } catch (err) {
            console.error(`[Promotion] Error:`, err);
            ErrorService.handleError(err, { context: 'CharacterSheetSpecializations.handlePromote' });
        }
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
            ErrorService.handleError(err, { context: 'CharacterSheetSpecializations.Drop', silent: true });
        }
    };

    const findSkill = (skillId: string): DotEntry | null => {
        for (const cat of Object.keys(data.skills)) {
            const skill = data.skills[cat].find((s: DotEntry) => s.id === skillId);
            if (skill) return skill;
        }
        return null;
    };

    const renderSkillBox = (skill: DotEntry) => {
        const count = skill.value;
        const imposedSpecs = skill.value > 0
            ? (data.imposedSpecializations[skill.id] || []).filter((spec: any) => skill.value >= (spec.minLevel || 0))
            : [];

        if (count <= 0 && imposedSpecs.length === 0) return null;

        const userSpecs = data.specializations[skill.id] || [];

        return (
            <div
                key={skill.id}
                className="border border-stone-300 p-1.5 bg-white/50 backdrop-blur-sm shadow-sm flex flex-col gap-1.5 rounded-md group/skill hover:border-amber-400 hover:bg-white transition-all duration-200"
                onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-amber-50', 'border-amber-400');
                }}
                onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-amber-50', 'border-amber-400');
                }}
                onDrop={(e) => {
                    e.currentTarget.classList.remove('bg-amber-50', 'border-amber-400');
                    handleDrop(e, skill.id);
                }}
            >
                <div className="font-black text-[9px] uppercase tracking-tighter flex justify-between items-center text-stone-500 group-hover/skill:text-amber-700 transition-colors px-0.5">
                    <span className="truncate" title={skill.name}>{skill.name}</span>
                    <span className="opacity-40 text-[8px]">({count})</span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {/* Render Imposed Specializations first (Read Only) */}
                    {imposedSpecs.map((spec: any, i: number) => (
                        <div key={`imp-${i}`} className="bg-slate-100 border border-slate-200 rounded-full py-0.5 px-2 flex items-center shadow-inner h-5">
                            <div className="w-1 h-1 rounded-full bg-slate-400 mr-1.5 shrink-0"></div>
                            <span className="text-[10px] font-bold text-slate-600 truncate leading-none" title={spec.name}>
                                {spec.name}
                            </span>
                        </div>
                    ))}

                    {/* Render User Specializations */}
                    {Array.from({ length: count }).map((_, i) => {
                        const hasValue = !!userSpecs[i];
                        return (
                            <div
                                key={`user-${i}`}
                                className={`relative flex items-center h-5 transition-all duration-200 ${hasValue
                                    ? 'bg-amber-50 border border-amber-200 rounded-full shadow-sm'
                                    : 'border-b border-dashed border-stone-300 hover:border-amber-400'
                                    }`}
                            >
                                <SpecializationOmnibar
                                    value={userSpecs[i] || ''}
                                    onChange={(val: string) => updateSpecialization(skill.id, i, val)}
                                    onPromote={(val: string) => handlePromote(skill.id, i, val)}
                                    skillId={skill.id}
                                    className="w-full"
                                    variant="sheet"
                                    showPlaceholder={false}
                                />
                                {!hasValue && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover/skill:opacity-20">
                                        <Plus size={8} className="text-stone-400" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderCategory = (title: string, categoryKey: SkillCategoryKey) => {
        const categoryData = data.skills[categoryKey];
        if (!categoryData || !Array.isArray(categoryData)) return null;

        // Show skill if it has dots OR imposed specializations
        const skills = categoryData.filter((s: any) => {
            if (!s || !s.name || s.name.trim() === '') return false; // Skip spacers
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
                    {/* Dynamic Rendering from Rules */}
                    {rules?.definitions?.skillCategories
                        ?.filter((cat: any) => cat.behavior === 'Compétence' || cat.behavior === 'Secondaire')
                        ?.map((cat: any) => (
                            <div key={cat.id}>
                                {renderCategory(cat.label, cat.id as any)}
                            </div>
                        ))}

                    {/* Fallback Rendering if no rules / legacy keys */}
                    {(!rules || !rules.definitions?.skillCategories) && (
                        <>
                            {renderCategory("Talents", "talents" as any)}
                            {renderCategory("Compétences", "competences" as any)}
                            {renderCategory("Compétences (Suite)", "competences_col_2" as any)}
                            {renderCategory("Connaissances", "connaissances" as any)}
                            {renderCategory("Autres Compétences", "autres_competences" as any)}
                            {renderCategory("Autres", "autres" as any)}
                        </>
                    )}
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
