
import React from 'react';
import { TraitEntry } from '../../../types';
import { Edit } from 'lucide-react';

interface TraitRowProps {
    item: TraitEntry;
    onClick: () => void;
}

const TraitRow: React.FC<TraitRowProps> = ({ item, onClick }) => {
    const isEmpty = !item.name.trim();
    
    return (
        <div 
            onClick={onClick}
            className={`flex gap-1 items-center h-[22px] px-1 transition-all rounded-sm cursor-pointer group select-none ${
                isEmpty 
                ? 'hover:bg-slate-50 border-b border-dotted border-stone-200' 
                : 'hover:bg-blue-50 bg-white/50 border-b border-stone-300 shadow-sm'
            }`}
        >
            <div className={`w-8 shrink-0 text-center font-bold text-xs h-full flex items-center justify-center border-r border-stone-300 ${
                isEmpty ? 'text-stone-300' : 'text-stone-800 font-handwriting bg-white'
            }`} style={{ fontSize: '0.9rem' }}>
                {item.value || (isEmpty ? '-' : '')}
            </div>
            
            <div className={`flex-grow h-full flex items-center px-1 font-handwriting min-w-0 ${
                isEmpty ? 'text-stone-300 italic text-[10px]' : 'text-ink'
            }`} style={{ fontSize: isEmpty ? '0.7rem' : '0.9rem' }}>
                <span className="truncate w-full block" title={!isEmpty ? item.name : undefined}>
                    {item.name || "Vide"}
                </span>
            </div>

            <div className="opacity-0 group-hover:opacity-100 text-stone-400 scale-75 transition-opacity shrink-0">
                <Edit size={14} />
            </div>
        </div>
    );
};

export default TraitRow;
