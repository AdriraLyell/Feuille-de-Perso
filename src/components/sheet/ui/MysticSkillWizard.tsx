import React, { useState, useMemo } from 'react';
import { CharacterSheetData } from '../../../types';
import { RulesData } from '../../../types/rules';
import { Sparkles, CheckCircle2, AlertCircle, Infinity as InfinityIcon } from 'lucide-react';
import { getMysticCapacity } from '../../../utils/mysticUtils';
import ThematicModal from '../../ui/ThematicModal';

interface MysticSkillWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedSkillIds: string[]) => void;
    mysticAbilityId: string;
    mysticAbilityName: string;
    sheet: CharacterSheetData;
    rules: RulesData;
}

const MysticSkillWizard: React.FC<MysticSkillWizardProps> = ({
    isOpen,
    onClose,
    onConfirm,
    mysticAbilityId,
    mysticAbilityName,
    sheet,
    rules
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Capacity Calculation
    const capacity = useMemo(() => getMysticCapacity(sheet, mysticAbilityId, rules), [sheet, mysticAbilityId, rules]);
    const { allowed, current, traitLevel } = capacity;
    const remainingSlots = Math.max(0, allowed - current - selectedIds.size);

    // Filter available skills
    const availableSkills = useMemo(() => {
        const allLibSkills = rules.libraries.skills || [];
        // Filter by mysticAbilityId
        return allLibSkills.filter(s => s.mysticAbilityId === mysticAbilityId)
            // Filter out already owned skills
            .filter(s => {
                const owned = Object.values(sheet.skills).flat().some(ownedSkill => ownedSkill.name === s.name && ownedSkill.value > 0);
                return !owned;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.libraries.skills, mysticAbilityId, sheet.skills]);

    const handleToggle = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            if (remainingSlots > 0) {
                newSelected.add(id);
            }
        }
        setSelectedIds(newSelected);
    };

    const handleConfirm = () => {
        onConfirm(Array.from(selectedIds));
        onClose();
    };

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Habilitées Mystiques : ${mysticAbilityName}`}
            icon={<Sparkles className="text-purple-400" />}
            size="lg"
            footer={
                <>
                    <div className="flex-1 text-xs text-stone-400">
                        {selectedIds.size === 0 ? "Aucune sélection" : `${selectedIds.size} compétence(s) sélectionnée(s)`}
                    </div>
                    <button onClick={onClose} className="px-4 py-2 text-stone-400 hover:text-stone-200">
                        Passer
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        className={`px-6 py-2 rounded font-bold shadow-lg flex items-center gap-2 transition ${selectedIds.size > 0 ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}
                    >
                        <CheckCircle2 size={16} />
                        Valider la sélection
                    </button>
                </>
            }
        >
            <div className="space-y-4 bg-stone-900 p-6 rounded-lg border border-stone-700">
                {/* Capacity Info */}
                <div className="bg-purple-900/20 border border-purple-500/30 rounded p-4 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-purple-200 mb-1">Capacité Mystique (Niveau {traitLevel})</div>
                        <div className="text-xs text-purple-300/80">
                            {allowed === 999 ? (
                                <>
                                    Vous avez un accès <span className="text-white font-bold">illimité</span> aux compétences liées.<br />
                                    Actuellement connues : <span className="text-white font-bold">{current}</span>.
                                </>
                            ) : (
                                <>
                                    Vous pouvez apprendre jusqu'à <span className="text-white font-bold">{allowed}</span> compétences liées.
                                    Actuellement connues : <span className="text-white font-bold">{current}</span>.
                                </>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        {allowed === 999 ? (
                            <>
                                <div className="text-purple-400 flex justify-end mb-1"><InfinityIcon size={32} /></div>
                                <div className="text-[10px] uppercase tracking-wider text-purple-500 font-bold">SANS LIMITE</div>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-purple-400">{remainingSlots}</div>
                                <div className="text-[10px] uppercase tracking-wider text-purple-500 font-bold">Slots Restants</div>
                            </>
                        )}
                    </div>
                </div>

                {remainingSlots === 0 && selectedIds.size === 0 && (
                    <div className="bg-amber-900/20 border border-amber-500/30 rounded p-3 flex gap-3 items-start">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                        <div className="text-xs text-amber-200/80">
                            Vous avez atteint la limite de compétences pour ce niveau d'Avantage. Augmentez l'Avantage pour débloquer plus de slots.
                        </div>
                    </div>
                )}

                {/* Skill List */}
                <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                    {availableSkills.length === 0 ? (
                        <div className="text-center py-10 text-stone-500 italic">
                            Toutes les compétences disponibles sont déjà apprises.
                        </div>
                    ) : (
                        availableSkills.map(skill => {
                            const isSelected = selectedIds.has(skill.id);
                            const isDisabled = !isSelected && remainingSlots === 0;

                            return (
                                <div
                                    key={skill.id}
                                    onClick={() => !isDisabled && handleToggle(skill.id)}
                                    className={`
                                        relative group flex items-center gap-3 p-3 rounded border transition cursor-pointer
                                        ${isSelected
                                            ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_15px_-3px_rgba(147,51,234,0.3)]'
                                            : isDisabled
                                                ? 'bg-stone-900/20 border-stone-800 opacity-50 cursor-not-allowed'
                                                : 'bg-stone-800/40 border-stone-700 hover:border-purple-500/50 hover:bg-stone-800/80'}
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0
                                        ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-stone-600 bg-stone-900/50 text-transparent'}
                                    `}>
                                        <CheckCircle2 size={12} />
                                    </div>

                                    <div className="flex-grow">
                                        <div className={`font-bold text-sm ${isSelected ? 'text-purple-200' : 'text-stone-300'}`}>
                                            {skill.name}
                                        </div>
                                        {skill.description && (
                                            <div className="text-xs text-stone-500 line-clamp-1 group-hover:line-clamp-none transition">
                                                {skill.description}
                                            </div>
                                        )}
                                    </div>

                                    {skill.defaultCategory && (
                                        <div className="text-[10px] uppercase font-bold text-stone-600 px-2 py-1 bg-stone-900 rounded shrink-0">
                                            {skill.defaultCategory}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </ThematicModal>
    );
};

export default MysticSkillWizard;
