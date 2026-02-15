
import React, { useState } from 'react';
import { LibraryEntry } from '../../types';
import { Zap, Edit2, Trash2, Plus, CheckSquare, Square, Lock, Globe, Layers } from 'lucide-react';

interface TraitCardProps {
    entry: LibraryEntry;
    isEditable: boolean;
    isSelected: boolean;
    onSelect?: (entry: LibraryEntry) => void;
    onMultiSelect?: (id: string) => void;
    onEdit: (entry: LibraryEntry) => void;
    onDelete: (id: string) => void;
    showMultiSelect: boolean;
    source?: 'local' | 'official' | 'modified';
    isLocked?: boolean;
    isActive?: boolean;
}

const TraitCard: React.FC<TraitCardProps> = ({
    entry,
    isEditable,
    isSelected,
    onSelect,
    onMultiSelect,
    onEdit,
    onDelete,
    showMultiSelect,
    source = 'local',
    isLocked = false,
    isActive = true
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    if (!entry) return null;

    const hasVariants = entry.variants && entry.variants.length > 0;

    return (
        <div
            className={`p-2 transition-colors group cursor-pointer select-none border-b border-slate-100 last:border-0 flex items-center gap-2 ${isSelected ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-stone-50'} ${!isActive ? 'opacity-60 grayscale' : ''}`}
            onClick={() => {
                if (showMultiSelect && onMultiSelect) {
                    onMultiSelect(entry.id);
                } else if (onSelect) {
                    onSelect(entry);
                }
            }}
        >
            {/* 1. Toggle / Type Indicator (Fixed width) */}
            <div className="w-8 flex flex-col items-center justify-center shrink-0 gap-1">
                {showMultiSelect ? (
                    <div className="text-[#8b2e2e]">
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-[#bfae85]" />}
                    </div>
                ) : (
                    <div className={`w-2.5 h-2.5 rounded-full ${entry.type === 'avantage' ? 'bg-green-600' : 'bg-[#8b2e2e]'}`} title={entry.type === 'avantage' ? 'Avantage' : 'Désavantage'} />
                )}
            </div>

            {/* 2. Status Icons (Fixed width) */}
            <div className="w-16 flex items-center gap-1 shrink-0">
                {entry.isVariable && (
                    <div
                        className="relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        title={!hasVariants ? "Trait à variantes" : undefined}
                    >
                        <Layers
                            size={14}
                            className="text-blue-500"
                        />

                        {showTooltip && hasVariants && (
                            <div className="absolute z-[100] left-0 bottom-full mb-2 w-max max-w-[200px] bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl animate-in fade-in zoom-in duration-150 pointer-events-none">
                                <div className="font-bold border-b border-slate-600 mb-1 pb-1 text-slate-300">
                                    Variantes suggérées
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {entry.variants?.map((v, i) => (
                                        <span key={i} className="bg-slate-700 px-1 rounded-sm border border-slate-600">{v}</span>
                                    ))}
                                </div>
                                {/* Arrow */}
                                <div className="absolute left-2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
                            </div>
                        )}
                    </div>
                )}
                {source === 'official' && <div title="Trait Officiel"><Globe size={14} className="text-indigo-500" /></div>}
                {entry.effects && entry.effects.length > 0 && <div title="Effets mécaniques"><Zap size={14} className="text-amber-500 fill-amber-500" /></div>}
                {isLocked && <div title="Trait utilisé"><Lock size={14} className="text-amber-600" /></div>}
            </div>

            {/* 3. Content (Flexible) */}
            <div className="flex-grow overflow-hidden pr-2">
                <div className="flex justify-between items-baseline gap-2">
                    <span className={`font-bold text-sm truncate ${isSelected ? 'text-amber-900' : 'text-[#4a3b32]'} ${!isActive ? 'line-through text-slate-500' : ''}`} title={entry.name}>
                        {entry.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#5c4d41] bg-[#bfae85]/20 px-1 rounded-sm border border-[#bfae85]/10 shrink-0">
                        {entry.cost} pts
                    </span>
                </div>
                {entry.description && (
                    <div className="text-[10px] text-[#5c4d41]/70 italic truncate" title={entry.description}>
                        {entry.description}
                    </div>
                )}
                {/* Tags displayed on hover or if space allows? Let's keep them compact */}
                {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {entry.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[8px] bg-stone-100 text-[#5c4d41]/60 px-1 rounded-sm border border-stone-200">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. Actions (Fixed width) */}
            <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {isEditable && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Éditer"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                            disabled={isLocked}
                            className={`p-1 rounded ${isLocked ? 'text-stone-300' : 'text-red-600 hover:bg-red-50'}`}
                            title={isLocked ? "Action impossible : trait utilisé" : "Supprimer"}
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
                {onSelect && !showMultiSelect && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(entry); }}
                        className="p-1 text-green-700 hover:bg-green-50 rounded border border-green-200 shadow-sm bg-white"
                        title="Ajouter à la fiche"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TraitCard;
