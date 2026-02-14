
import React from 'react';
import { TraitEffect } from '../../types';
import { Zap, X, Star, GraduationCap, Dumbbell, ChevronDown } from 'lucide-react';

interface TraitEffectEditorProps {
    effects: TraitEffect[];
    allSkills: { id: string, name: string }[];
    allAttributes: { id: string, name: string }[];
    onAdd: () => void;
    onUpdate: <K extends keyof TraitEffect>(id: string, field: K, value: TraitEffect[K]) => void;
    onRemove: (id: string) => void;
}

const TraitEffectEditor: React.FC<TraitEffectEditorProps> = ({
    effects,
    allSkills,
    allAttributes,
    onAdd,
    onUpdate,
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
                {(effects || []).map(effect => {
                    // Configuration visuelle par type
                    let typeIcon = <Star size={16} />;
                    let themeColor = 'text-amber-700';
                    let borderColor = 'border-amber-200';
                    let bgColor = 'bg-white';

                    if (effect.type === 'xp_bonus') {
                        typeIcon = <Star size={14} />;
                        themeColor = 'text-amber-800';
                        borderColor = 'border-amber-400/30';
                        bgColor = 'bg-amber-50/40';
                    } else if (effect.type === 'free_skill_rank') {
                        typeIcon = <GraduationCap size={14} />;
                        themeColor = 'text-blue-800';
                        borderColor = 'border-blue-400/30';
                        bgColor = 'bg-blue-50/40';
                    } else if (effect.type === 'attribute_bonus') {
                        typeIcon = <Dumbbell size={14} />;
                        themeColor = 'text-[#8b2e2e]';
                        borderColor = 'border-[#8b2e2e]/30';
                        bgColor = 'bg-[#8b2e2e]/5';
                    }

                    return (
                        <div key={effect.id} className={`rounded-lg border ${borderColor} ${bgColor} shadow-sm overflow-hidden group`}>

                            {/* Header Row: Type Selector & Delete */}
                            <div className="flex items-center justify-between p-2 border-b border-black/5 bg-white/60">
                                <div className="flex items-center gap-2 flex-grow relative">
                                    <div className={themeColor}>{typeIcon}</div>

                                    {/* Styled Dropdown Container */}
                                    <div className="relative flex-grow">
                                        <select
                                            className={`appearance-none bg-white border border-gray-300 font-bold text-xs text-gray-900 w-full focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer pr-4 py-1 pl-2 rounded shadow-sm`}
                                            value={effect.type}
                                            onChange={(e) => onUpdate(effect.id, 'type', e.target.value as any)}
                                        >
                                            <option value="attribute_bonus" className="text-gray-900 bg-white">Bonus Attribut</option>
                                            <option value="xp_bonus" className="text-gray-900 bg-white">Bonus XP</option>
                                            <option value="free_skill_rank" className="text-gray-900 bg-white">Rang de Compétence Gratuit</option>
                                        </select>
                                        <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${themeColor} opacity-50`} />
                                    </div>
                                </div>
                                <button onClick={() => onRemove(effect.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors ml-2">
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Content Row: Specific Inputs */}
                            <div className="p-3">
                                {effect.type === 'xp_bonus' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-[#5c4d41] uppercase tracking-wide">Montant XP :</span>
                                        <input
                                            type="number"
                                            className="flex-grow border border-[#bfae85]/30 rounded-sm px-2 py-1 text-sm font-mono text-center focus:border-amber-500 outline-none bg-white/80 text-[#1c1917] font-bold"
                                            placeholder="0"
                                            value={effect.value}
                                            onChange={(e) => onUpdate(effect.id, 'value', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                ) : effect.type === 'free_skill_rank' ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest">Compétence</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 appearance-none focus:border-blue-500 outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm"
                                                    value={effect.target || ''}
                                                    onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                                                >
                                                    <option value="" className="text-stone-300">-- Choisir --</option>
                                                    {allSkills.map(s => (
                                                        <option key={s.id} value={s.name}>{s.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-800/40" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest text-center">Rang Offert</label>
                                            <input
                                                type="number"
                                                className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 text-center focus:border-blue-500 outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm font-mono"
                                                value={effect.value}
                                                onChange={(e) => onUpdate(effect.id, 'value', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest">Attribut</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 appearance-none focus:border-[#8b2e2e] outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm"
                                                    value={effect.target || ''}
                                                    onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                                                >
                                                    <option value="" className="text-stone-300">-- Choisir --</option>
                                                    {allAttributes.map(a => (
                                                        <option key={a.id} value={a.name}>{a.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#8b2e2e]/40" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest text-center">Bonus (+)</label>
                                            <input
                                                type="number"
                                                className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 text-center focus:border-[#8b2e2e] outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm font-mono"
                                                value={effect.value}
                                                onChange={(e) => onUpdate(effect.id, 'value', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TraitEffectEditor;
