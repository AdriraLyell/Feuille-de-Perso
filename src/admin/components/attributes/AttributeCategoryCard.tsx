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
    onAddAttribute: () => void;
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
    onAddAttribute,
    onRemoveAttribute,
    onRemoveCategory
}) => {
    return (
        <div className="bg-white p-4 rounded shadow-sm border border-slate-200 flex flex-col h-full relative group/col">
            <button
                onClick={() => onRemoveCategory(id)}
                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/col:opacity-100 transition-opacity"
                title="Supprimer ce pavé"
            >
                <Trash2 size={16} />
            </button>

            {/* Header with Editable Label */}
            <div className="mb-4 border-b border-slate-200 pb-2 pr-6">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">ID: {id}</label>
                <input
                    value={label}
                    onChange={(e) => onUpdateLabel(id, e.target.value)}
                    className="font-bold text-lg bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none w-full text-slate-800"
                />
            </div>

            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                    <Shield size={12} /> Primaires
                </h4>
                <button
                    onClick={onAddAttribute}
                    className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-200 transition-colors font-bold"
                    title="Ajouter un attribut à TOUS les pavés"
                >
                    +
                </button>
            </div>
            <div className="space-y-1 mb-6 flex-grow">
                {primaryAttrs.map((name, index) => (
                    <div key={`prim-${index}`} className="flex items-center gap-2 group">
                        <span className="text-[10px] text-slate-300 w-4 select-none">{index + 1}</span>
                        <input
                            value={name}
                            onChange={(e) => onUpdatePrimary(id, index, e.target.value)}
                            className="flex-grow text-sm font-medium border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-1 py-0.5 outline-none bg-transparent focus:bg-white transition-all"
                        />
                        <button
                            onClick={() => onRemoveAttribute(index)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                            title="Supprimer cet index de TOUS les pavés"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Secondary Attributes (Global Toggle) */}
            {isSecondaryActive && (
                <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-4 px-4 pb-2 rounded-b sticky bottom-0 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-2 pt-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Zap size={12} /> Secondaires
                        </h4>
                    </div>
                    <div className="space-y-1">
                        {[0, 1].map((index) => (
                            <div key={`sec-${index}`} className="flex items-center gap-2 group">
                                <span className="text-[10px] text-slate-300 w-4 select-none">+{index + 1}</span>
                                <input
                                    value={secondaryAttrs[index] || ""}
                                    onChange={(e) => onUpdateSecondary(id, index, e.target.value)}
                                    className="flex-grow text-xs text-slate-600 border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 outline-none bg-transparent focus:bg-white transition-all"
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
