// COMPLEX COMPONENT: VERIFY RETURNS CAREFULLY
import React from 'react';
import { Trash2, Shield, Zap } from 'lucide-react';

interface AttributeCategoryCardProps {
    id: string;
    label: string;
    primaryAttrs: string[];
    secondaryAttrs: string[];
    isSecondaryActive: boolean;
    onUpdateLabel: (id: string, val: string) => void;
    onUpdatePrimary: (id: string, idx: number, val: string) => void;
    onUpdateSecondary: (id: string, idx: number, val: string) => void;
    onRemoveAttribute: (idx: number) => void;
    onRemoveCategory: (id: string) => void;
}

const AttributeCategoryCard: React.FC<AttributeCategoryCardProps> = ({
    id,
    label,
    primaryAttrs,
    secondaryAttrs,
    isSecondaryActive,
    onUpdateLabel,
    onUpdatePrimary,
    onUpdateSecondary,
    onRemoveAttribute,
    onRemoveCategory
}) => {
    return (
        <div className="bg-stone-900/40 p-4 rounded-sm shadow-sm border border-stone-700/50 flex flex-col h-full relative group/col hover:border-amber-500/30 transition-colors">
            <button
                onClick={() => onRemoveCategory(id)}
                className="absolute top-2 right-2 text-stone-600 hover:text-crimson-blood opacity-0 group-hover/col:opacity-100 transition-opacity"
                title="Supprimer ce pavé"
            >
                <Trash2 size={16} />
            </button>

            {/* Header with Editable Label */}
            <div className="mb-4 border-b border-stone-700/50 pb-2 pr-6">
                <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1 tracking-widest">ID: {id}</label>
                <input
                    value={label}
                    onChange={(e) => onUpdateLabel(id, e.target.value)}
                    className="font-serif font-bold text-lg bg-transparent border-b border-dashed border-stone-600 focus:border-amber-500 outline-none w-full text-amber-500 tracking-wide"
                />
            </div>

            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-stone-400 uppercase flex items-center gap-1 tracking-wider">
                    <Shield size={12} className="text-stone-500" /> Primaires
                </h4>
            </div>
            <div className="space-y-1 mb-6 flex-grow">
                {primaryAttrs.map((name, index) => (
                    <div key={`prim-${index}`} className="flex items-center gap-2 group">
                        <span className="text-[10px] text-stone-600 w-4 select-none font-bold">{index + 1}</span>
                        <input
                            value={name}
                            onChange={(e) => onUpdatePrimary(id, index, e.target.value)}
                            className="flex-grow text-sm font-bold border border-transparent hover:border-stone-600 focus:border-amber-500 rounded-sm px-1 py-0.5 outline-none bg-transparent focus:bg-stone-950 text-stone-300 transition-all placeholder-stone-700"
                        />
                        <button
                            onClick={() => onRemoveAttribute(index)}
                            className="text-stone-600 hover:text-crimson-blood opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                            title="Supprimer cet index de TOUS les pavés"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Secondary Attributes (Global Toggle) */}
            {isSecondaryActive && (
                <div className="pt-4 border-t border-stone-800 bg-stone-950/30 -mx-4 px-4 pb-2 rounded-b sticky bottom-0 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-2 pt-2">
                        <h4 className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1 tracking-wider">
                            <Zap size={12} /> Secondaires
                        </h4>
                    </div>
                    <div className="space-y-1">
                        {[0, 1].map((index) => (
                            <div key={`sec-${index}`} className="flex items-center gap-2 group">
                                <span className="text-[10px] text-stone-600 w-4 select-none">+{index + 1}</span>
                                <input
                                    value={secondaryAttrs[index] || ""}
                                    onChange={(e) => onUpdateSecondary(id, index, e.target.value)}
                                    className="flex-grow text-xs font-medium text-stone-400 border border-transparent hover:border-stone-600 focus:border-amber-500 rounded-sm px-1 py-0.5 outline-none bg-transparent focus:bg-stone-950 transition-all placeholder-stone-700"
                                    placeholder={`Secondaire ${index + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttributeCategoryCard;
