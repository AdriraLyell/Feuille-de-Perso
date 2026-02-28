import React from 'react';
import { TraitEffect, LibraryFormulaEntry } from '../../types';
import { Zap } from 'lucide-react';
import { TraitEffectItem } from './effects/TraitEffectItem';

interface TraitEffectEditorProps {
    effects: TraitEffect[];
    allSkills: { id: string, name: string }[];
    allAttributes: { id: string, name: string }[];
    allCounters: { id: string, name: string }[];
    allFormulas?: LibraryFormulaEntry[];
    onAdd: () => void;
    onUpdate: <K extends keyof TraitEffect>(id: string, field: K, value: TraitEffect[K]) => void;
    onUpdateFields?: (id: string, updates: Partial<TraitEffect>) => void;
    onRemove: (id: string) => void;
}

const TraitEffectEditor: React.FC<TraitEffectEditorProps> = ({
    effects,
    allSkills,
    allAttributes,
    allCounters,
    allFormulas = [],
    onAdd,
    onUpdate,
    onUpdateFields,
    onRemove
}) => {
    return (
        <div className="p-4 bg-stone-100/5 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
                <h5 className="font-serif font-black uppercase text-[10px] text-[#bfae85] tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-amber-600/60" />
                    Effets Mécaniques
                </h5>
                <button
                    onClick={onAdd}
                    className="text-[10px] bg-white/50 border border-[#bfae85]/30 hover:bg-amber-50 text-[#5c4d41] px-3 py-1 rounded-sm font-bold transition-colors shadow-sm"
                >
                    + Ajouter
                </button>
            </div>

            <div className="space-y-3">
                {(!effects || effects.length === 0) && (
                    <div className="text-center text-amber-800/40 text-xs italic py-2">
                        Aucun effet configuré. Ce trait sera purement narratif.
                    </div>
                )}
                {(effects || []).map((effect, index) => (
                    <TraitEffectItem
                        key={effect.id || `effect-${index}`}
                        effect={effect}
                        index={index}
                        allSkills={allSkills}
                        allAttributes={allAttributes}
                        allCounters={allCounters}
                        allFormulas={allFormulas}
                        onUpdate={onUpdate}
                        onUpdateFields={onUpdateFields}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        </div >
    );
};

export default TraitEffectEditor;
