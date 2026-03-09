
import { useCharacterState, useCharacterActions } from '../context/CharacterContext';
import { CharacterSheetData, DotEntry, SuggestionEntry } from '../types';
import SpecializationOmnibar from './specialization-library/SpecializationOmnibar';
import SpecializationLibraryDrawer from './specialization-library/SpecializationLibraryDrawer';
import ConfirmationModal from './ui/ConfirmationModal';
import { Award, ArrowUpCircle, Plus, Zap } from 'lucide-react';
import { useState } from 'react';
import { useRules } from '../context/RulesContext';
import { logger } from '../utils/logger';
import { ErrorService } from '../services/ErrorService';
import { createDotEntry, generateId } from '../utils/factories';

interface Props {
    isLandscape?: boolean;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="bg-slate-200 text-slate-800 text-center font-bold text-xs border-y border-stone-500 uppercase py-0.5 mt-3 mb-2 tracking-wide shadow-sm rounded-sm">
        {title}
    </div>
);

const CharacterSheetSpecializations: React.FC<Props> = ({ isLandscape = false }) => {
    const { data, resolvedData } = useCharacterState();
    const { updateData: onChange, addLog: onAddLog } = useCharacterActions();
    const { rules } = useRules();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [duplicateErrorModal, setDuplicateErrorModal] = useState<string | null>(null);
    const [promoteImposedModal, setPromoteImposedModal] = useState<{ skillId: string; specName: string } | null>(null);

    const getSkillName = (skillId: string): string => {
        for (const cat of Object.keys(resolvedData.skills)) {
            const skill = resolvedData.skills[cat].find((s: DotEntry) => s.id === skillId);
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

        const valTrimmed = value.trim();
        let newSuggestions = data.suggestions || [];
        if (valTrimmed) {
            const isKnown = rules?.libraries?.specializations?.some(s => s.name.trim().toLowerCase() === valTrimmed.toLowerCase());
            if (!isKnown) {
                const alreadySuggested = newSuggestions.some(s => s.type === 'specialization' && s.name.trim().toLowerCase() === valTrimmed.toLowerCase());
                if (!alreadySuggested) {
                    newSuggestions = [
                        ...newSuggestions,
                        {
                            id: generateId(),
                            type: 'specialization',
                            name: valTrimmed,
                            category: skillId,
                            parentId: skillId,
                            timestamp: Date.now(),
                            description: rules?.libraries?.specializations?.find(s => s.name.trim().toLowerCase() === valTrimmed.toLowerCase())?.description
                        }
                    ];
                    onAddLog(`Suggestion de spécialité créée : ${valTrimmed}`, 'info', 'sheet');
                }
            }
        }

        onChange({
            ...data,
            specializations: {
                ...data.specializations,
                [skillId]: newSpecs
            },
            suggestions: newSuggestions
        });

        const skillName = getSkillName(skillId);
        onAddLog(`Spécialité modifiée (${skillName}) : ${value}`, 'info', 'sheet', `spec_${skillId}_${index}`);
    };

    const handlePromote = (skillId: string, index: number, specName: string) => {
        try {
            if (!specName || specName.trim() === '') return;

            // 1. Identifier la catégorie cible "Secondaire"
            const secondaryCat = rules?.definitions?.skillCategories?.find(cat => cat.behavior === 'Secondaire' || cat.label.toLowerCase().includes('secondaire'))?.id || 'competences_secondaires';

            // 2. Vérifier si la compétence n'existe pas déjà
            const existingSkills = data.skills[secondaryCat] || [];
            const isDuplicate = existingSkills.some((s: DotEntry) => s.name.trim().toLowerCase() === specName.trim().toLowerCase());

            if (isDuplicate) {
                onAddLog(`La compétence secondaire "${specName}" existe déjà.`, 'danger', 'sheet');
                setDuplicateErrorModal(specName);
                return;
            }

            logger.info(`[Promotion] Promouvoir "${specName}" vers ${secondaryCat} (Skill ID: ${skillId}, Index: ${index})`);

            // 3. Créer la nouvelle compétence (valeur 0 comme demandé)
            const newSkill = createDotEntry(specName, 0);

            // 4. Mettre à jour les données de manière fonctionnelle pour éviter tout souci de synchronisation
            onChange((prev: CharacterSheetData) => {
                const currentSpecs = prev.specializations[skillId] || [];
                const newSpecs = [...currentSpecs];
                newSpecs[index] = ""; // Libère l'emplacement

                const currentCatSkills = prev.skills[secondaryCat] || [];

                let newSuggestions = prev.suggestions || [];
                const isKnownInLib = rules?.libraries?.skills?.some(s => s.name.trim().toLowerCase() === specName.trim().toLowerCase());
                if (!isKnownInLib) {
                    const alreadySuggested = newSuggestions.some(s => s.type === 'skill' && s.name.trim().toLowerCase() === specName.trim().toLowerCase());
                    if (!alreadySuggested) {
                        newSuggestions = [
                            ...newSuggestions,
                            {
                                id: generateId(),
                                type: 'skill',
                                name: specName.trim(),
                                category: secondaryCat,
                                timestamp: Date.now()
                            }
                        ];
                    }
                }

                return {
                    ...prev,
                    skills: {
                        ...prev.skills,
                        [secondaryCat]: [...currentCatSkills, newSkill]
                    },
                    specializations: {
                        ...prev.specializations,
                        [skillId]: newSpecs
                    },
                    suggestions: newSuggestions
                };
            });

            onAddLog(`Spécialité "${specName}" promue en compétence secondaire.`, 'success', 'sheet');
        } catch (err) {
            logger.error(`[Promotion] Error:`, err);
            ErrorService.handleError(err, { context: 'CharacterSheetSpecializations.handlePromote' });
        }
    };

    const handlePromoteImposed = (skillId: string, specName: string) => {
        try {
            if (!specName || specName.trim() === '') return;

            // 1. Identifier la catégorie cible "Secondaire"
            const secondaryCat = rules?.definitions?.skillCategories?.find(cat => cat.behavior === 'Secondaire' || cat.label.toLowerCase().includes('secondaire'))?.id || 'competences_secondaires';

            // 2. Vérifier si la compétence n'existe pas déjà
            const existingSkills = data.skills[secondaryCat] || [];
            const isDuplicate = existingSkills.some((s: DotEntry) => s.name.trim().toLowerCase() === specName.trim().toLowerCase());

            if (isDuplicate) {
                onAddLog(`La compétence secondaire "${specName}" existe déjà.`, 'danger', 'sheet');
                setDuplicateErrorModal(specName);
                return;
            }

            logger.info(`[PromotionImposée] Promouvoir "${specName}" vers ${secondaryCat} (Skill ID: ${skillId})`);

            // 3. Créer la nouvelle compétence (valeur 0)
            const newSkill = createDotEntry(specName, 0);

            // 4. Ajouter la compétence sans toucher aux specs imposées (le MJ reste maître)
            onChange((prev: CharacterSheetData) => {
                let newSuggestions = prev.suggestions || [];
                const isKnownInLib = rules?.libraries?.skills?.some(s => s.name.trim().toLowerCase() === specName.trim().toLowerCase());
                if (!isKnownInLib) {
                    const alreadySuggested = newSuggestions.some(s => s.type === 'skill' && s.name.trim().toLowerCase() === specName.trim().toLowerCase());
                    if (!alreadySuggested) {
                        newSuggestions = [
                            ...newSuggestions,
                            {
                                id: generateId(),
                                type: 'skill',
                                name: specName.trim(),
                                category: secondaryCat,
                                timestamp: Date.now()
                            }
                        ];
                    }
                }

                return {
                    ...prev,
                    skills: {
                        ...prev.skills,
                        [secondaryCat]: [...(prev.skills[secondaryCat] || []), newSkill]
                    },
                    suggestions: newSuggestions
                };
            });

            onAddLog(`Spécialité imposée "${specName}" convertie en compétence secondaire.`, 'success', 'sheet');
        } catch (err) {
            logger.error(`[PromotionImposée] Error:`, err);
            ErrorService.handleError(err, { context: 'CharacterSheetSpecializations.handlePromoteImposed' });
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
        const imposedSpecs = (data.imposedSpecializations[skill.id] || [])
            .filter((spec: { minLevel?: number }) => skill.value >= (spec.minLevel || 0));

        if (count <= 0 && imposedSpecs.length === 0) return null;

        const userSpecs = data.specializations[skill.id] || [];

        // Détection des doublons (insensible à la casse)
        const allSpecNames = [
            ...imposedSpecs.map((s: { name: string }) => s.name.trim().toLowerCase()),
            ...userSpecs.filter(Boolean).map((s: string) => s.trim().toLowerCase())
        ];

        const nameCounts = allSpecNames.reduce((acc: Record<string, number>, name: string) => {
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});

        const isNameDuplicate = (name: string): boolean => !!(name && nameCounts[name.trim().toLowerCase()] > 1);

        return (
            <div
                key={skill.id}
                className="border border-stone-300 p-1.5 bg-white/50 backdrop-blur-sm shadow-sm flex flex-col gap-1.5 rounded-md group/skill hover:border-amber-400 hover:bg-white transition duration-200"
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
                role="region"
                aria-label={`Spécialités pour ${skill.name}`}
            >
                <div className="font-black text-[9px] uppercase tracking-tighter flex justify-between items-center text-stone-500 group-hover/skill:text-amber-700 transition-colors px-0.5">
                    <span className="truncate" title={skill.name}>{skill.name}</span>
                    <span className="opacity-40 text-[8px]">({count})</span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {/* Render Imposed Specializations first (avec bouton de promotion) */}
                    {imposedSpecs.map((spec: { name: string }, i: number) => {
                        const isDup = isNameDuplicate(spec.name);
                        return (
                            <div key={`imp-${i}`} className={`group/imposed rounded-full py-0.5 px-2 flex items-center shadow-inner h-5 transition-colors border ${isDup
                                ? 'bg-pink-100 border-pink-400 text-pink-900'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                                }`}>
                                <Zap size={10} className={`${isDup ? 'text-pink-600 fill-pink-600' : 'text-blue-500 fill-blue-500'} mr-1 shrink-0`} />
                                <span className="text-[10px] font-bold truncate leading-none flex-1" title={spec.name}>
                                    {spec.name}
                                </span>
                                <button
                                    onClick={() => setPromoteImposedModal({ skillId: skill.id, specName: spec.name })}
                                    className="opacity-0 group-hover/imposed:opacity-100 transition-opacity ml-0.5 text-indigo-500 hover:text-indigo-700"
                                    title="Transformer en compétence secondaire"
                                >
                                    <ArrowUpCircle size={10} />
                                </button>
                            </div>
                        );
                    })}

                    {/* Render User Specializations */}
                    {Array.from({ length: count }).map((_, i) => {
                        const val = userSpecs[i] || '';
                        const hasValue = !!val;
                        const isDup = isNameDuplicate(val);

                        return (
                            <div
                                key={`user-${i}`}
                                className={`relative flex items-center h-5 transition duration-200 ${hasValue
                                    ? isDup
                                        ? 'bg-pink-100 border border-pink-400 rounded-full shadow-sm'
                                        : 'bg-amber-50 border border-amber-200 rounded-full shadow-sm'
                                    : 'border-b border-dashed border-stone-300 hover:border-amber-400'
                                    }`}
                            >
                                <SpecializationOmnibar
                                    value={val}
                                    onChange={(newVal: string) => updateSpecialization(skill.id, i, newVal)}
                                    onPromote={(newVal: string) => handlePromote(skill.id, i, newVal)}
                                    skillId={skill.id}
                                    className="w-full"
                                    variant="sheet"
                                    showPlaceholder={false}
                                    isDuplicate={isDup}
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

    const renderCategory = (title: string, categoryKey: string) => {
        const categoryData = resolvedData.skills[categoryKey];
        if (!categoryData || !Array.isArray(categoryData)) return null;

        // Show skill if it has dots OR imposed specializations
        const skills = categoryData.filter((s: DotEntry) => {
            if (!s || !s.name || s.name.trim() === '') return false; // Skip spacers
            const hasPoints = s.value > 0;
            const hasImposed = data.imposedSpecializations[s.id] && data.imposedSpecializations[s.id].length > 0;
            // Always show if it has points or if MJ imposed something
            return hasPoints || hasImposed;
        });

        if (skills.length === 0) return null;

        const gridCols = isLandscape ? 'grid-cols-7' : 'grid-cols-5';

        return (
            <div className="mb-1 break-inside-avoid">
                <SectionHeader title={title} />
                <div className={`grid ${gridCols} gap-2`}>
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
        <div className={`flex justify-center transition duration-300 ${isDrawerOpen ? 'pr-80' : ''}`}>
            <div className={`sheet-container p-6 ${isLandscape ? 'landscape' : ''}`}>

                <h1 className="text-3xl font-black text-center uppercase py-2 tracking-widest border-b-2 border-stone-800 mb-4 text-indigo-950 font-serif relative">
                    Spécialités
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold py-1 px-3 rounded shadow-sm transition-colors flex items-center gap-1 uppercase cursor-pointer"
                    >
                        <Award size={14} /> Catalogue
                    </button>
                </h1>

                <div className="flex-grow flex flex-col overflow-hidden">
                    {!hasAnySkill && (
                        <div className="text-center text-stone-400 italic mt-20 flex-grow flex items-center justify-center">
                            <div>
                                <p className="mb-2 text-lg">Aucune compétence (principale) ne possède de point ou de spécialité imposée.</p>
                                <p className="text-sm">Ajoutez des points dans l'onglet "Personnage" pour voir apparaître les champs de spécialité ici.</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-0.5 overflow-auto">
                        {/* Dynamic Rendering from Rules */}
                        {rules?.definitions?.skillCategories
                            ?.filter(cat => cat.behavior === 'Compétence')
                            ?.map(cat => (
                                <div key={cat.id}>
                                    {renderCategory(cat.label, cat.id)}
                                </div>
                            ))}

                        {/* Fallback Rendering if no rules / legacy keys */}
                        {(!rules || !rules.definitions?.skillCategories) && (
                            <>
                                {renderCategory("Talents", "talents")}
                                {renderCategory("Compétences", "competences")}
                                {renderCategory("Compétences (Suite)", "competences_col_2")}
                                {renderCategory("Connaissances", "connaissances")}
                                {renderCategory("Autres Compétences", "autres_competences")}
                                {renderCategory("Autres", "autres")}
                            </>
                        )}
                    </div>
                </div>

                <SpecializationLibraryDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                />

                {duplicateErrorModal && (
                    <ConfirmationModal
                        isOpen={!!duplicateErrorModal}
                        onClose={() => setDuplicateErrorModal(null)}
                        onConfirm={() => setDuplicateErrorModal(null)}
                        title="Promotion Impossible"
                        message={
                            <span>
                                La compétence secondaire <strong>"{duplicateErrorModal}"</strong> existe déjà.
                                <br /><br />
                                <span className="text-[11px] opacity-80">
                                    Veuillez supprimer la compétence existante ou choisir une autre spécialité à promouvoir.
                                </span>
                            </span>
                        }
                        confirmLabel="Compris"
                        cancelLabel=""
                        type="danger"
                        scheme="paper"
                    />
                )}

                {promoteImposedModal && (
                    <ConfirmationModal
                        isOpen={!!promoteImposedModal}
                        onClose={() => setPromoteImposedModal(null)}
                        onConfirm={() => {
                            handlePromoteImposed(promoteImposedModal.skillId, promoteImposedModal.specName);
                            setPromoteImposedModal(null);
                        }}
                        title="Transformer en Compétence Secondaire"
                        message={
                            <span>
                                Souhaitez-vous transformer <strong>"{promoteImposedModal.specName}"</strong> en compétence secondaire ?
                                <br /><br />
                                <span className="text-[11px] opacity-80">
                                    Une nouvelle compétence sera créée avec une valeur de 0. La spécialité imposée restera visible (elle est définie par les règles).
                                </span>
                            </span>
                        }
                        confirmLabel="Transformer"
                        cancelLabel="Annuler"
                        type="warning"
                        scheme="paper"
                    />
                )}
            </div>
        </div>
    );
};

export default CharacterSheetSpecializations;
