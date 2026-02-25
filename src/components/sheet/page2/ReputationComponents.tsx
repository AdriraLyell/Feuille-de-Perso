import React from 'react';

export const ReputationHeader: React.FC = () => (
    <div className="bg-slate-200 text-slate-800 text-xs border-y border-stone-500 uppercase py-0.5 tracking-wide mb-0.5 flex items-center min-h-[1.5rem] shadow-sm font-bold shrink-0">
        <span className="w-1/2 text-center pl-1">Réputation</span>
        <span className="w-1/4 text-center border-l border-stone-400">Lieu</span>
        <span className="w-1/4 text-center border-l border-stone-400">Valeur</span>
    </div>
);

interface ReputationRowProps {
    index: number;
    reputation: string;
    lieu: string;
    valeur: string;
    onChange: (index: number, field: 'reputation' | 'lieu' | 'valeur', value: string) => void;
    onKeyDown: (e: React.KeyboardEvent, index: number, field: 'reputation' | 'lieu' | 'valeur') => void;
}

export const ReputationRow: React.FC<ReputationRowProps> = ({
    index,
    reputation,
    lieu,
    valeur,
    onChange,
    onKeyDown
}) => (
    <div className="flex h-[22px] items-end shrink-0 border-b border-stone-200">
        <input
            id={`rep-row-${index}-rep`}
            className="w-1/2 bg-transparent font-handwriting text-ink text-sm h-full px-1 focus:outline-none"
            value={reputation}
            onChange={(e) => onChange(index, 'reputation', e.target.value)}
            onKeyDown={(e) => onKeyDown(e, index, 'reputation')}
        />
        <input
            id={`rep-row-${index}-lieu`}
            className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none"
            value={lieu}
            onChange={(e) => onChange(index, 'lieu', e.target.value)}
            onKeyDown={(e) => onKeyDown(e, index, 'lieu')}
        />
        <input
            id={`rep-row-${index}-val`}
            className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none"
            value={valeur}
            onChange={(e) => onChange(index, 'valeur', e.target.value)}
            onKeyDown={(e) => onKeyDown(e, index, 'valeur')}
        />
    </div>
);
