import React from 'react';
import { ChevronDown, Trophy } from 'lucide-react';
import { TraitEffect } from '../../../types';

interface LegacyEffectFieldsProps {
    effect: TraitEffect;
    allSkills: { id: string, name: string }[];
    allAttributes: { id: string, name: string }[];
    onUpdate: (id: string, field: keyof TraitEffect, value: string | number | undefined) => void;
}

export const LegacyEffectFields: React.FC<LegacyEffectFieldsProps> = ({
    effect,
    allSkills,
    allAttributes,
    onUpdate
}) => {
    if (effect.type === 'free_skill_rank') {
        return (
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
                            {allSkills.map((s, si) => (
                                <option key={s.id || `skill-${si}`} value={s.name}>{s.name}</option>
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
        );
    }

    if (effect.type === 'block_skill_increase') {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex flex-col">
                    <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest">Compétence à bloquer</label>
                    <div className="relative">
                        <select
                            className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 appearance-none focus:border-red-500 outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm"
                            value={effect.target || ''}
                            onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                        >
                            <option value="" className="text-stone-300">-- Choisir --</option>
                            {allSkills.map((s, si) => (
                                <option key={s.id || `skill-${si}`} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-red-800/40" />
                    </div>
                    <p className="text-[9px] text-[#8b2e2e]/60 mt-1 italic leading-tight">
                        Cette compétence ne pourra plus être augmentée par le joueur. Les points futurs seront masqués et le nom barré.
                    </p>
                </div>
            </div>
        );
    }


    if (effect.type === 'master_skill') {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                    <Trophy size={14} className="text-purple-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-purple-800 leading-tight">
                        Quand le joueur ajoute ce trait, il choisit une <strong>compétence à rang 0</strong>.<br />
                        Celle-ci est automatiquement mise au <strong>rang 5</strong>, gratuitement (sans coût XP).<br />
                        La compétence revient à 0 si le trait est supprimé.
                    </p>
                </div>
            </div>
        );
    }

    // Default: Attribute bonus
    return (
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
                        {allAttributes.map((a, ai) => (
                            <option key={a.id || `attr-${ai}`} value={a.name}>{a.name}</option>
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
    );
};
