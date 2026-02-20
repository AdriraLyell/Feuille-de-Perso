import React from 'react';
import { CalendarConfigReal } from '../../../types/rules';

import CalendarEventsList from './CalendarEventsList';
import { CalendarDays } from 'lucide-react';

interface Props {
    config: CalendarConfigReal;
    onUpdate: (config: CalendarConfigReal) => void;
}

const RealCalendarConfig: React.FC<Props> = ({ config, onUpdate }) => {
    const advance = (unit: 'day' | 'week' | 'month') => {
        const d = new Date(config.currentDate);
        if (unit === 'day') d.setDate(d.getDate() + 1);
        else if (unit === 'week') d.setDate(d.getDate() + 7);
        else d.setMonth(d.getMonth() + 1);
        onUpdate({ ...config, currentDate: d.toISOString().split('T')[0] });
    };

    const currentDateObj = config.currentDate ? new Date(config.currentDate) : null;
    const startDateObj = config.startDate ? new Date(config.startDate) : null;
    const diffDays = (currentDateObj && startDateObj)
        ? Math.floor((currentDateObj.getTime() - startDateObj.getTime()) / 86400000)
        : null;

    const DAY_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    return (
        <div className="space-y-6">
            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                        Date de début de campagne
                    </label>
                    <input
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
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                        Date courante (dans la fiction)
                    </label>
                    <input
                        type="date"
                        value={config.currentDate ?? ''}
                        onChange={e => onUpdate({ ...config, currentDate: e.target.value })}
                        className="w-full bg-stone-800 border border-stone-600 rounded-sm px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-gold/60 transition-colors"
                    />
                    {currentDateObj && (
                        <p className="text-stone-500 text-xs mt-1 flex items-center gap-2">
                            <CalendarDays size={11} />
                            {DAY_FR[currentDateObj.getDay()]} {currentDateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {diffDays !== null && diffDays >= 0 && (
                                <span className="text-amber-gold/70">— J+{diffDays}</span>
                            )}
                        </p>
                    )}
                </div>
            </div>

            {/* Boutons avance rapide */}
            <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Avance rapide</span>
                <div className="flex gap-2 mt-2">
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
            </div>

            {/* Événements */}
            <div className="border-t border-stone-700/50 pt-6">
                <CalendarEventsList
                    events={config.events}
                    mode="real"
                    onUpdate={events => onUpdate({ ...config, events })}
                />
            </div>
        </div>
    );
};

export default RealCalendarConfig;
