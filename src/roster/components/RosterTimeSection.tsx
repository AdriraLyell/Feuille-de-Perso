import React, { useMemo } from 'react';
import { Clock, ChevronDown, ChevronRight, CalendarDays, RotateCcw } from 'lucide-react';
import { calculateMoonPhase } from '../../utils/moonPhase';

interface RosterTimeSectionProps {
    showTimeManagement: boolean;
    setShowTimeManagement: (v: boolean) => void;
    currentDate: string;
    onAdvanceTime: (amount: 'day' | 'week' | 'month') => void;
    onRollbackTime: () => void;
}

export const RosterTimeSection: React.FC<RosterTimeSectionProps> = ({
    showTimeManagement,
    setShowTimeManagement,
    currentDate,
    onAdvanceTime,
    onRollbackTime
}) => {
    const moon = useMemo(() => calculateMoonPhase(currentDate), [currentDate]);

    return (
        <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark mb-12">
            <button
                onClick={() => setShowTimeManagement(!showTimeManagement)}
                className="w-full p-4 flex justify-between items-center bg-stone-950 border-b border-stone-800 hover:bg-stone-900 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <h2 className="font-serif font-bold text-lg text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={20} className="text-amber-600" /> Gestion Temporelle
                    </h2>
                    {!showTimeManagement && (
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-serif font-bold text-amber-400 capitalize px-3 py-1 mt-0.5 rounded-sm border border-stone-800 bg-stone-900/50 shadow-glass-dark">
                                {currentDate}
                            </span>
                            {moon && (
                                <div className="flex items-center gap-2 text-stone-300 text-[11px] font-bold bg-stone-900 border border-amber-900/40 px-2.5 py-1 rounded shadow-sm">
                                    <span className="text-sm drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]">{moon.emoji}</span>
                                    <span className="hidden sm:inline uppercase tracking-wider text-[10px] text-amber-500/90">{moon.name}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {showTimeManagement ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} className="text-amber-600" />}
            </button>

            {showTimeManagement && (
                <div className="p-5 bg-stone-900/20 flex flex-col md:flex-row items-center justify-center gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold hidden md:block">
                            Date Courante :
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-xl font-serif font-black text-amber-400 capitalize bg-stone-950 border border-stone-800 px-6 py-2 rounded-sm shadow-glass-dark mt-0">
                                {currentDate}
                            </div>
                            {moon && (
                                <div className="mt-3 flex items-center gap-3 px-4 py-1.5 bg-stone-950 border border-stone-800 rounded shadow-glass-dark">
                                    <span className="text-2xl drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">{moon.emoji}</span>
                                    <span className="text-sm font-serif font-bold text-amber-500 uppercase tracking-[0.15em]">{moon.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={onRollbackTime}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-950/40 hover:bg-rose-950/20 text-stone-400 hover:text-rose-400 rounded-sm font-bold text-sm uppercase tracking-wider border border-stone-800 hover:border-rose-900/30 transition-all shadow-sm group"
                            title="Corriger une erreur (revenir d'un jour)"
                        >
                            <RotateCcw size={16} className="group-hover:-rotate-45 transition-transform" /> Jour -1
                        </button>

                        <button
                            onClick={() => onAdvanceTime('day')}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-sm font-bold text-sm uppercase tracking-wider border border-stone-700 hover:border-amber-500/50 transition-colors"
                        >
                            <CalendarDays size={16} className="text-amber-600" /> +1 Jour
                        </button>
                        <button
                            onClick={() => onAdvanceTime('week')}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-sm font-bold text-sm uppercase tracking-wider border border-stone-700 hover:border-amber-500/50 transition-colors"
                        >
                            <CalendarDays size={16} className="text-amber-600" /> +1 Semaine
                        </button>
                        <button
                            onClick={() => onAdvanceTime('month')}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-sm font-bold text-sm uppercase tracking-wider border border-stone-700 hover:border-amber-500/50 transition-colors"
                        >
                            <CalendarDays size={16} className="text-amber-600" /> +1 Mois
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
