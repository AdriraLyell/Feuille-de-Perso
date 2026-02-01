
import React from 'react';
import { TraitEffect } from '../../types';
import { Zap, X, Star, GraduationCap, Dumbbell, ChevronDown } from 'lucide-react';

interface TraitEffectEditorProps {
    effects: TraitEffect[];
    allSkills: { id: string, name: string }[];
    allAttributes: { id: string, name: string }[];
    onAdd: () => void;
    onUpdate: (id: string, field: keyof TraitEffect, value: any) => void;
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
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h5 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                    <Zap size={16} className="text-amber-600 fill-amber-600" />
                    Effets Mécaniques (Automatisés)
                </h5>
                <button
                    onClick={onAdd}
                    className="text-xs bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold transition-colors shadow-sm"
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
                        typeIcon = <Star size={16} />;
                        themeColor = 'text-amber-700';
                        borderColor = 'border-amber-300';
                        bgColor = 'bg-amber-50/50';
                    } else if (effect.type === 'free_skill_rank') {
                        typeIcon = <GraduationCap size={16} />;
                        themeColor = 'text-blue-700';
                        borderColor = 'border-blue-300';
                        bgColor = 'bg-blue-50/50';
                    } else if (effect.type === 'attribute_bonus') {
                        typeIcon = <Dumbbell size={16} />;
                        themeColor = 'text-rose-700';
                        borderColor = 'border-rose-300';
                        bgColor = 'bg-rose-50/50';
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
                                            onChange={(e) => onUpdate(effect.id, 'type', e.target.value)}
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
                                        <span className="text-xs font-bold text-gray-500">Montant XP :</span>
                                        <input
                                            type="number"
                                            className="flex-grow border border-gray-300 rounded px-2 py-1 text-sm font-mono text-center focus:border-amber-500 outline-none"
                                            placeholder="0"
                                            value={effect.value}
                                            onChange={(e) => onUpdate(effect.id, 'value', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                ) : effect.type === 'free_skill_rank' ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 mb-0.5 uppercase">Compétence Ciblée</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 appearance-none focus:border-blue-500 outline-none bg-white text-gray-900"
                                                    value={effect.target || ''}
                                                    onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                                                >
                                                    <option value="" className="text-gray-400">-- Choisir --</option>
                                                    {allSkills.map(s => (
                                                        <option key={s.id} value={s.name} className="text-gray-900 bg-white">{s.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-0.5 uppercase">Rang Max</label>
                                            <input
                                                type="number"
                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 text-center focus:border-blue-500 outline-none"
                                                value={effect.value}
                                                onChange={(e) => onUpdate(effect.id, 'value', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 mb-0.5 uppercase">Attribut Ciblé</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 appearance-none focus:border-rose-500 outline-none bg-white text-gray-900"
                                                    value={effect.target || ''}
                                                    onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                                                >
                                                    <option value="" className="text-gray-400">-- Choisir --</option>
                                                    {allAttributes.map(a => (
                                                        <option key={a.id} value={a.name} className="text-gray-900 bg-white">{a.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-0.5 uppercase">Bonus (+)</label>
                                            <input
                                                type="number"
                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 text-center focus:border-rose-500 outline-none"
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
