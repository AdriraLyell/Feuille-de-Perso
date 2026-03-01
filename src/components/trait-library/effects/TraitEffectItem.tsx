import React from 'react';
import { X, Star, GraduationCap, ChevronDown, Trophy, Calculator } from 'lucide-react';
import { TraitEffect, LibraryFormulaEntry } from '../../../types';
import { FormulaEffectFields } from './FormulaEffectFields';
import { LegacyEffectFields } from './LegacyEffectFields';

interface TraitEffectItemProps {
    effect: TraitEffect;
    index: number;
    allSkills: { id: string, name: string }[];
    allAttributes: { id: string, name: string }[];
    allCounters: { id: string, name: string }[];
    allFormulas: LibraryFormulaEntry[];
    onUpdate: <K extends keyof TraitEffect>(id: string, field: K, value: TraitEffect[K]) => void;
    onUpdateFields?: (id: string, updates: Partial<TraitEffect>) => void;
    onRemove: (id: string) => void;
}

export const TraitEffectItem: React.FC<TraitEffectItemProps> = ({
    effect,

    allSkills,
    allAttributes,
    allCounters,
    allFormulas,
    onUpdate,
    onUpdateFields,
    onRemove
}) => {
    // Configuration visuelle par type
    let typeIcon = <Star size={16} />;
    let themeColor = 'text-amber-700';
    let borderColor = 'border-amber-200';
    let bgColor = 'bg-white';

    if (effect.type === 'formula') {
        typeIcon = <Calculator size={14} />;
        themeColor = 'text-indigo-800';
        borderColor = 'border-indigo-400/30';
        bgColor = 'bg-indigo-50/40';
    } else if (effect.type === 'free_skill_rank') {
        typeIcon = <GraduationCap size={14} />;
        themeColor = 'text-blue-800';
        borderColor = 'border-blue-400/30';
        bgColor = 'bg-blue-50/40';
    } else if (effect.type === 'master_skill') {
        typeIcon = <Trophy size={14} />;
        themeColor = 'text-purple-800';
        borderColor = 'border-purple-400/30';
        bgColor = 'bg-purple-50/40';
    }

    return (
        <div className={`rounded-lg border ${borderColor} ${bgColor} shadow-sm overflow-hidden group`}>
            {/* Header Row: Type Selector & Delete */}
            <div className="flex items-center justify-between p-2 border-b border-black/5 bg-white/60">
                <div className="flex items-center gap-2 flex-grow relative">
                    <div className={themeColor}>{typeIcon}</div>

                    <div className="relative flex-grow">
                        <select
                            className={`appearance-none bg-white border border-gray-300 font-bold text-xs text-gray-900 w-full focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer pr-4 py-1 pl-2 rounded shadow-sm`}
                            value={effect.type}
                            onChange={(e) => onUpdate(effect.id, 'type', e.target.value as any)}
                        >
                            <option value="formula" className="text-gray-900 bg-white font-bold bg-indigo-50">Calcul par Formule</option>

                            {['free_skill_rank', 'master_skill', 'block_skill_increase'].includes(effect.type) && (
                                <optgroup label="Anciens Types (Hérités)">
                                    {effect.type === 'free_skill_rank' && <option value="free_skill_rank">Rang de Compétence Offert</option>}
                                    {effect.type === 'master_skill' && <option value="master_skill">Maîtrise (Rang 5 direct)</option>}
                                    {effect.type === 'block_skill_increase' && <option value="block_skill_increase">Bloquer une Progression</option>}
                                </optgroup>
                            )}
                        </select>
                        <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${themeColor} opacity-50`} />
                    </div>
                </div>
                <button
                    onClick={() => onRemove(effect.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors ml-2"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content Row: Specific Inputs */}
            <div className="p-3">
                {effect.type === 'formula' ? (
                    <FormulaEffectFields
                        effect={effect}
                        allFormulas={allFormulas}
                        allAttributes={allAttributes}
                        allCounters={allCounters}
                        onUpdate={onUpdate}
                        onUpdateFields={onUpdateFields}
                    />
                ) : (
                    <LegacyEffectFields
                        effect={effect}
                        allSkills={allSkills}
                        allAttributes={allAttributes}
                        onUpdate={onUpdate}
                    />
                )}
            </div>
        </div>
    );
};
