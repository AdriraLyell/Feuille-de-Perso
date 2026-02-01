
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
}

const TraitCard: React.FC<TraitCardProps> = ({
    entry,
    isEditable,
    isSelected,
    onSelect,
    onMultiSelect,
    onEdit,
    onDelete,
    showMultiSelect
}) => {
    return (
        <div
            className={`p-3 hover:bg-gray-50 transition-colors group cursor-pointer select-none ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
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
                    <div className="mt-1 text-blue-600 shrink-0">
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
                    </div>
                )}

                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${entry.type === 'avantage' ? 'bg-green-500' : 'bg-red-500'}`} title={entry.type === 'avantage' ? 'Avantage' : 'Désavantage'} />

                <div className="flex-grow">
                    <div className="flex justify-between items-baseline mb-1">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>{entry.name}</span>
                            {/* Effect Indicator */}
                            {entry.effects && entry.effects.length > 0 && (
                                <div title="Ce trait possède des effets mécaniques">
                                    <Zap size={12} className="text-amber-500 fill-amber-500" />
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{entry.cost} pts</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-1.5">
                        {entry.description || <span className="italic text-gray-300">Pas de description</span>}
                    </p>

                    {/* Display Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {entry.tags.map(tag => (
                                <span key={tag} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditable && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Éditer">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Supprimer">
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}
                    {onSelect && !showMultiSelect && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(entry); }}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded border border-green-200 shadow-sm bg-white"
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
