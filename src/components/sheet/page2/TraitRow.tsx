
import React from 'react';
import { TraitEntry } from '../../../types';
import { Edit, Trash2, Wand2, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';

interface TraitRowProps {
    item: TraitEntry;
    type: 'avantages' | 'desavantages';
    onClick: () => void;
    onRemove: (e: React.MouseEvent) => void;
    onManageMystic?: (e: React.MouseEvent) => void;
}

const TraitRow: React.FC<TraitRowProps> = ({ item, type, onClick, onRemove, onManageMystic }) => {
    const isEmpty = !item.name.trim();
    const isResolved = item.value === '0' && item.creationValue !== undefined;

    const isPostCreation = item.isPostCreation && !isResolved;

    // Use internal trait type if defined, otherwise fall back to the component prop
    const internalTraitType = item.type;
    const isDisadvantage = internalTraitType ? (internalTraitType === 'desavantage') : (type === 'desavantages');
    const isAdvantage = internalTraitType ? (internalTraitType === 'avantage') : (type === 'avantages');

    const isImproved = !isPostCreation && item.creationValue !== undefined && parseInt(item.value) > parseInt(item.creationValue);
    const isReduced = !isPostCreation && item.creationValue !== undefined && parseInt(item.value) < parseInt(item.creationValue);

    const isPostCreationAdvantage = isPostCreation && isAdvantage;
    const isPostCreationDisadvantage = isPostCreation && isDisadvantage;

    return (
        <div
            onClick={onClick}
            className={`flex gap-1 items-center h-[22px] px-1 transition-all rounded-sm cursor-pointer group select-none ${isEmpty
                ? 'hover:bg-slate-50 border-b border-dotted border-stone-200'
                : (isPostCreationAdvantage || isImproved)
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-b border-emerald-200 shadow-sm'
                    : (isPostCreationDisadvantage)
                        ? 'bg-red-50 hover:bg-red-100 border-b border-red-200 shadow-sm'
                        : (isReduced)
                            ? 'bg-amber-50 hover:bg-amber-100 border-b border-amber-200 shadow-sm'
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
                    <span className="inline-flex items-center gap-1 mr-1.5 leading-none">
                        {isPostCreationAdvantage && <span title="Acquis avec XP"><Sparkles size={11} className="text-emerald-600 fill-emerald-600/20" strokeWidth={2.5} /></span>}
                        {isPostCreationDisadvantage && <span title="Nouveau Désavantage (Gain XP)"><Sparkles size={11} className="text-red-500 fill-red-500/20" strokeWidth={2.5} /></span>}
                        {isImproved && <span title="Amélioré avec XP"><ArrowUp size={11} className="text-blue-600" strokeWidth={3} /></span>}
                        {isReduced && <span title="Racheté avec XP"><ArrowDown size={11} className="text-orange-600" strokeWidth={3} /></span>}
                    </span>
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
