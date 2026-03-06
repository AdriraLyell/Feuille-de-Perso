import React from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';
import { ImportCandidate } from '../../hooks/useLibraryImport';

interface CandidateLineProps {
    candidate: ImportCandidate<unknown>;
    onToggle: () => void;
    importDestination: 'campaign' | 'global';
    typeLabel?: string;
    showType?: boolean;
    extraInfo?: React.ReactNode;
}

const CandidateLine: React.FC<CandidateLineProps> = ({
    candidate,
    onToggle,
    importDestination,
    typeLabel,
    showType,
    extraInfo
}) => {
    const isVariableDisabled = importDestination === 'global' && candidate.isVariable;
    const isDisabled = candidate.isDuplicate || isVariableDisabled;

    const data = candidate.data as Record<string, unknown>;

    return (
        <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${candidate.isDuplicate ? 'bg-slate-50 opacity-60 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
            <input
                type="checkbox"
                checked={candidate.isSelected}
                disabled={isDisabled}
                onChange={onToggle}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
            />
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    {showType && typeLabel && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${data.type === 'avantage' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {typeLabel}
                        </span>
                    )}
                    <span className="font-bold text-slate-800 text-sm">{candidate.name}</span>
                    {candidate.isVariable && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                            <Zap size={10} /> Variable
                        </span>
                    )}
                    {Boolean(data.cost) && (
                        <span className="text-xs text-slate-400 font-mono">({String(data.cost)} pts)</span>
                    )}
                </div>
                {Boolean(data.description) && (
                    <p className={`text-xs text-slate-500 italic mt-0.5 ${candidate.isVariable ? 'text-amber-600/70' : ''}`}>
                        {String(data.description)}
                    </p>
                )}
                {extraInfo}
            </div>
            {candidate.isDuplicate && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    <CheckCircle2 size={12} /> Doublon
                </div>
            )}
        </div>
    );
};

export default CandidateLine;
