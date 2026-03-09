import React from 'react';
import { CalendarConfigReal } from '../../../types/rules';

import CalendarEventsList from './CalendarEventsList';
import { CalendarDays, RotateCcw } from 'lucide-react';
import { calculateMoonPhase } from '../../../utils/moonPhase';
import { getWesternZodiac, getChineseZodiac } from '../../../utils/zodiac';

interface Props {
    config: CalendarConfigReal;
    onUpdate: (config: CalendarConfigReal) => void;
}

const RealCalendarConfig: React.FC<Props> = ({ config, onUpdate }) => {
    const advance = (unit: 'day' | 'week' | 'month') => {
        const d = new Date(config.currentDate || new Date().toISOString());
        if (unit === 'day') d.setDate(d.getDate() + 1);
        else if (unit === 'week') d.setDate(d.getDate() + 7);
        else d.setMonth(d.getMonth() + 1);

        onUpdate({
            ...config,
            currentDate: d.toISOString().split('T')[0]
        });
    };

    const rollbackOneDay = () => {
        const d = new Date(config.currentDate || new Date().toISOString());
        d.setDate(d.getDate() - 1);

        onUpdate({
            ...config,
            currentDate: d.toISOString().split('T')[0]
        });
    };

    const currentDateObj = config.currentDate ? new Date(config.currentDate) : null;
    const startDateObj = config.startDate ? new Date(config.startDate) : null;
    const diffDays = (currentDateObj && startDateObj)
        ? Math.floor((currentDateObj.getTime() - startDateObj.getTime()) / 86400000)
        : null;

    const DAY_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    return (
        <div className="space-y-6" >
            {/* Dates */}
            < div className="grid grid-cols-1 sm:grid-cols-2 gap-6" >
                <div>
                    <label
                        htmlFor="campaign-start-date"
                        className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2"
                    >
                        Date de début de campagne
                    </label>
                    <input
                        id="campaign-start-date"
                        type="date"
                        value={config.startDate ?? ''}
                        onChange={e => onUpdate({ ...config, startDate: e.target.value })}
                        className="w-full bg-stone-800 border border-stone-600 rounded-sm px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-gold/60 transition-colors"
                    />
                    {startDateObj && (
                        <p className="text-stone-500 text-xs mt-1">
                            {DAY_FR[startDateObj.getDay()]} {startDateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="campaign-current-date"
                        className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2"
                    >
                        Date courante (dans la fiction)
                    </label>
                    <input
                        id="campaign-current-date"
                        type="date"
                        value={config.currentDate ?? ''}
                        onChange={e => onUpdate({ ...config, currentDate: e.target.value })}
                        className="w-full bg-stone-800 border border-stone-600 rounded-sm px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-gold/60 transition-colors"
                    />
                    {currentDateObj && (
                        <div className="flex flex-col gap-1 mt-1">
                            <p className="text-stone-500 text-xs flex items-center gap-2">
                                <CalendarDays size={11} />
                                {DAY_FR[currentDateObj.getDay()]} {currentDateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {diffDays !== null && diffDays >= 0 && (
                                    <span className="text-amber-gold/70">— J+{diffDays}</span>
                                )}
                            </p>
                            {(() => {
                                const moon = calculateMoonPhase(currentDateObj);
                                const zodiac = getWesternZodiac(currentDateObj);
                                const chineseZodiac = getChineseZodiac(currentDateObj);

                                if (!moon && !zodiac && !chineseZodiac) return null;

                                return (
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {moon && (
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-stone-900 border border-amber-900/40 rounded shadow-sm" title="Phase Lunaire">
                                                <span className="text-base drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]">{moon.emoji}</span>
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">
                                                    {moon.name}
                                                </span>
                                            </div>
                                        )}
                                        {zodiac && (
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-stone-900 border border-amber-900/40 rounded shadow-sm" title="Signe du Zodiaque">
                                                <span className="text-base drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]">{zodiac.emoji}</span>
                                                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest leading-none">
                                                    {zodiac.name}
                                                </span>
                                            </div>
                                        )}
                                        {chineseZodiac && (
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-stone-900 border border-amber-900/40 rounded shadow-sm" title="Zodiaque Chinois">
                                                <span className="text-base drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]">{chineseZodiac.emoji}</span>
                                                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest leading-none">
                                                    {chineseZodiac.animal} <span className={chineseZodiac.elementColor}>({chineseZodiac.element})</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div >

            {/* Boutons avance rapide */}
            < div >
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Avance rapide</span>
                <div className="flex flex-wrap gap-2 mt-2">
                    <button
                        onClick={rollbackOneDay}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-stone-900/40 hover:bg-stone-800 border border-stone-800 hover:border-rose-900/40 text-stone-500 hover:text-rose-400 rounded-sm transition-all flex items-center gap-2"
                        title="Corriger une erreur (revenir d'un jour)"
                    >
                        <RotateCcw size={12} /> Jour -1
                    </button>

                    {(['day', 'week', 'month'] as const).map(unit => (
                        <button
                            key={unit}
                            onClick={() => advance(unit)}
                            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-stone-800 hover:bg-stone-700 border border-stone-600 hover:border-amber-gold/30 text-stone-300 hover:text-amber-gold rounded-sm transition-all"
                        >
                            +1 {unit === 'day' ? 'Jour' : unit === 'week' ? 'Semaine' : 'Mois'}
                        </button>
                    ))}
                </div>
            </div >

            {/* Événements */}
            < div className="border-t border-stone-700/50 pt-6" >
                <CalendarEventsList
                    events={config.events}
                    mode="real"
                    onUpdate={events => onUpdate({ ...config, events })}
                />
            </div >
        </div >
    );
};

export default RealCalendarConfig;
