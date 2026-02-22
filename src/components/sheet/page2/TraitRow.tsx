
import React from 'react';
import { TraitEntry } from '../../../types';
import { Edit, Trash2, Wand2 } from 'lucide-react';

interface TraitRowProps {
    item: TraitEntry;
    onClick: () => void;
    onRemove: (e: React.MouseEvent) => void;
    onManageMystic?: (e: React.MouseEvent) => void;
}

const TraitRow: React.FC<TraitRowProps> = ({ item, onClick, onRemove, onManageMystic }) => {
    const isEmpty = !item.name.trim();
    const isResolved = item.value === '0' && item.creationValue !== undefined;
    const isPostCreationAdvantage = item.isPostCreation && !isResolved;
    const isImproved = !item.isPostCreation && item.creationValue !== undefined && parseInt(item.value) > parseInt(item.creationValue);

    return (
        <div
            onClick={onClick}
            className={`flex gap-1 items-center h-[22px] px-1 transition-all rounded-sm cursor-pointer group select-none ${isEmpty
                ? 'hover:bg-slate-50 border-b border-dotted border-stone-200'
                : (isPostCreationAdvantage || isImproved)
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-b border-emerald-200 shadow-sm'
                    : 'hover:bg-blue-50 bg-white/50 border-b border-stone-300 shadow-sm'
                }`}
        >
            <div className={`w-8 shrink-0 text-center font-bold text-xs h-full flex items-center justify-center border-r border-stone-300 ${isEmpty ? 'text-stone-300' : 'text-stone-800 font-handwriting bg-white'
                } ${isResolved ? 'line-through opacity-50' : ''}`} style={{ fontSize: '0.9rem' }}>
                {item.value || (isEmpty ? '-' : '')}
            </div>

            <div className={`flex-grow h-full flex items-center px-1 font-handwriting min-w-0 ${isEmpty ? 'text-stone-300 italic text-[10px]' : 'text-ink'
                } ${isResolved ? 'line-through opacity-50' : ''}`} style={{ fontSize: isEmpty ? '0.7rem' : '0.9rem' }}>
                <span className="truncate w-full block" title={!isEmpty ? (item.variant ? `${item.name} : ${item.variant}` : item.name) : undefined}>
                    {item.isPostCreation && <span className="mr-1 text-emerald-600" title="Acquis avec XP">❇️</span>}
                    {isImproved && <span className="mr-1 text-blue-500" title="Amélioré avec XP">⬆️</span>}
                    {item.name || "Vide"}
                    {item.variant && <span className="font-bold ml-1 text-slate-600">: {item.variant}</span>}
                </span>
            </div>

            {!isEmpty && item.mysticAbilityId && onManageMystic && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onManageMystic(e);
                    }}
                    className="opacity-100 sm:opacity-0 group-hover:opacity-100 text-purple-400 hover:text-purple-600 scale-75 transition-all shrink-0 p-1 hover:bg-purple-50 rounded"
                    title="Gérer les compétences mystiques"
                >
                    <Wand2 size={14} />
                </div>
            )}

            {!isEmpty && (
                <div
                    onClick={onRemove}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 scale-75 transition-all shrink-0 p-1 hover:bg-red-50 rounded"
                    title="Supprimer"
                >
                    <Trash2 size={14} />
                </div>
            )}
            <div className="opacity-0 group-hover:opacity-100 text-stone-400 scale-75 transition-opacity shrink-0">
                <Edit size={14} />
            </div>
        </div>
    );
};

export default TraitRow;
