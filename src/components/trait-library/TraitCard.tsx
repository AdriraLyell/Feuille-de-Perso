
import React from 'react';
import { LibraryEntry } from '../../types';
import { Zap, Edit2, Trash2, Plus, CheckSquare, Square } from 'lucide-react';

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
    source = 'local'
}) => {
    if (!entry) return null;

    return (
        <div
            className={`p-3 hover:bg-stone-100/50 transition-colors group cursor-pointer select-none ${isSelected ? 'bg-amber-50/50 hover:bg-amber-100/50' : ''} ${source === 'official' ? 'border-l-2 border-l-blue-400 bg-blue-50/5' : ''}`}
            onClick={() => {
                if (showMultiSelect && onMultiSelect) {
                    onMultiSelect(entry.id);
                } else if (onSelect) {
                    onSelect(entry);
                }
            }}
        >
            <div className="flex items-start gap-3">
                {/* Multi-Select Checkbox */}
                {showMultiSelect && (
                    <div className="mt-1 text-[#8b2e2e] shrink-0">
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-[#bfae85]" />}
                    </div>
                )}

                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${entry.type === 'avantage' ? 'bg-green-600' : 'bg-[#8b2e2e]'}`} title={entry.type === 'avantage' ? 'Avantage' : 'Désavantage'} />

                <div className="flex-grow">
                    <div className="flex justify-between items-baseline mb-1">
                        <div className="flex items-center gap-2">
                            {source === 'official' && (
                                <span title="Trait Officiel" className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded-sm border border-blue-200 font-bold shrink-0">OFF</span>
                            )}
                            <span className={`font-bold text-sm ${isSelected ? 'text-amber-900' : 'text-[#4a3b32]'}`}>{entry.name}</span>
                            {/* Effect Indicator */}
                            {entry.effects && entry.effects.length > 0 && (
                                <div title="Ce trait possède des effets mécaniques">
                                    <Zap size={12} className="text-amber-600 fill-amber-600" />
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-mono font-bold text-[#5c4d41] bg-[#bfae85]/20 px-1.5 py-0.5 rounded-sm border border-[#bfae85]/30">{entry.cost} pts</span>
                    </div>
                    <p className="text-xs text-[#5c4d41]/90 leading-relaxed mb-1.5">
                        {entry.description || <span className="italic text-[#5c4d41]/40">Pas de description</span>}
                    </p>

                    {/* Display Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {entry.tags.map(tag => (
                                <span key={tag} className="text-[9px] bg-stone-200/50 text-[#5c4d41] px-1.5 py-0.5 rounded-sm border border-[#bfae85]/30">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditable && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="p-1.5 text-[#5c4d41] hover:bg-stone-200/50 rounded" title="Éditer">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}
                    {onSelect && !showMultiSelect && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(entry); }}
                            className="p-1.5 text-green-700 hover:bg-green-50 rounded border border-green-200 shadow-sm bg-white"
                            title="Ajouter à la fiche"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TraitCard;
