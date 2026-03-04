import React, { useState } from 'react';
import { CalendarConfigFictional, CalendarEvent, CalendarMonthDef, CalendarSeason } from '../../../types/rules';

import CalendarEventsList from './CalendarEventsList';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface Props {
    config: CalendarConfigFictional;
    onUpdate: (config: CalendarConfigFictional) => void;
}

const DEFAULT_DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const SEASON_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#f97316'];

const FictionalCalendarConfig: React.FC<Props> = ({ config, onUpdate }) => {
    const [seasonsOpen, setSeasonsOpen] = useState(false);

    // --- Mois ---
    const updateMonth = (i: number, patch: Partial<CalendarMonthDef>) => {
        const months = config.months.map((m: CalendarMonthDef, idx: number) => idx === i ? { ...m, ...patch } : m);
        onUpdate({ ...config, months });
    };
    const addMonth = () => {
        onUpdate({ ...config, months: [...config.months, { name: `Mois ${config.months.length + 1}`, days: 30 }] });
    };
    const removeMonth = (i: number) => {
        const months = config.months.filter((_: CalendarMonthDef, idx: number) => idx !== i);
        const seasons = config.seasons.map((s: CalendarSeason) => ({
            ...s,
            monthIndices: s.monthIndices.filter((mi: number) => mi !== i).map((mi: number) => mi > i ? mi - 1 : mi)
        }));
        onUpdate({
            ...config,
            months,
            seasons,
            currentMonthIndex: Math.min(config.currentMonthIndex, months.length - 1)
        });
    };

    // --- Jours de la semaine ---
    const updateDayName = (i: number, name: string) => {
        const dayNames = config.dayNames.map((d: string, idx: number) => idx === i ? name : d);
        onUpdate({ ...config, dayNames });
    };
    const addDay = () => {
        onUpdate({ ...config, dayNames: [...config.dayNames, `Jour ${config.dayNames.length + 1}`] });
    };
    const removeDay = (i: number) => {
        onUpdate({ ...config, dayNames: config.dayNames.filter((_: string, idx: number) => idx !== i) });
    };

    // --- Saisons ---
    const addSeason = () => {
        const s: CalendarSeason = {
            id: crypto.randomUUID(),
            name: `Saison ${config.seasons.length + 1}`,
            monthIndices: [],
            color: SEASON_COLORS[config.seasons.length % SEASON_COLORS.length]
        };
        onUpdate({ ...config, seasons: [...config.seasons, s] });
    };
    const updateSeason = (id: string, patch: Partial<CalendarSeason>) => {
        onUpdate({ ...config, seasons: config.seasons.map((s: CalendarSeason) => s.id === id ? { ...s, ...patch } : s) });
    };
    const removeSeason = (id: string) => {
        onUpdate({ ...config, seasons: config.seasons.filter((s: CalendarSeason) => s.id !== id) });
    };
    const toggleSeasonMonth = (seasonId: string, monthIdx: number) => {
        const season = config.seasons.find((s: CalendarSeason) => s.id === seasonId)!;
        const monthIndices = season.monthIndices.includes(monthIdx)
            ? season.monthIndices.filter((i: number) => i !== monthIdx)
            : [...season.monthIndices, monthIdx].sort((a, b) => a - b);
        updateSeason(seasonId, { monthIndices });
    };

    // --- Navigation Temporelle ---
    const advanceOneDay = () => {
        let { currentDay, currentMonthIndex, currentYear } = config;
        const currentMonthDays = config.months[currentMonthIndex]?.days ?? 30;

        currentDay++;
        if (currentDay > currentMonthDays) {
            currentDay = 1;
            currentMonthIndex++;
            if (currentMonthIndex >= config.months.length) {
                currentMonthIndex = 0;
                currentYear++;
            }
        }

        onUpdate({
            ...config,
            currentDay,
            currentMonthIndex,
            currentYear
        });
    };

    const rollbackOneDay = () => {
        let { currentDay, currentMonthIndex, currentYear } = config;

        currentDay--;
        if (currentDay < 1) {
            currentMonthIndex--;
            if (currentMonthIndex < 0) {
                currentMonthIndex = config.months.length - 1;
                currentYear--;
            }
            currentDay = config.months[currentMonthIndex]?.days ?? 30;
        }

        onUpdate({
            ...config,
            currentDay,
            currentMonthIndex,
            currentYear
        });
    };

    const inputCls = 'bg-stone-800 border border-stone-600 rounded-sm px-2 py-1 text-sm text-stone-200 focus:outline-none focus:border-amber-gold/60 transition-colors w-full';
    const labelCls = 'block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2';

    return (
        <div className="space-y-8" >
            {/* Dates courantes */}
            < div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-mystic-deep/30 p-4 rounded-sm border border-stone-700/30" >
                <div>
                    <label htmlFor="cal-start-year" className={labelCls}>Année de départ</label>
                    <input id="cal-start-year" type="number" value={config.startYear} onChange={e => onUpdate({ ...config, startYear: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                    <label htmlFor="cal-current-year" className={labelCls}>Année courante</label>
                    <input id="cal-current-year" type="number" value={config.currentYear} onChange={e => onUpdate({ ...config, currentYear: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                    <label htmlFor="cal-current-month" className={labelCls}>Mois courant</label>
                    <select id="cal-current-month" value={config.currentMonthIndex} onChange={e => onUpdate({ ...config, currentMonthIndex: Number(e.target.value) })} className={inputCls}>
                        {config.months.map((m: CalendarMonthDef, i: number) => <option key={i} value={i}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="cal-current-day" className={labelCls}>Jour courant</label>
                    <div className="flex gap-1">
                        <input
                            id="cal-current-day"
                            type="number"
                            min={1}
                            max={config.months[config.currentMonthIndex]?.days ?? 30}
                            value={config.currentDay}
                            onChange={e => onUpdate({ ...config, currentDay: Number(e.target.value) })}
                            className={inputCls}
                        />
                        <button
                            onClick={rollbackOneDay}
                            className="flex-shrink-0 w-8 flex items-center justify-center bg-stone-800 text-stone-400 rounded-sm hover:bg-stone-700 hover:text-rose-400 transition-colors border border-stone-700"
                            title="Revenir au jour précédent (erreur)"
                        >
                            <RotateCcw size={12} />
                        </button>
                        <button
                            onClick={advanceOneDay}
                            className="flex-shrink-0 px-3 flex items-center justify-center bg-amber-gold text-stone-900 rounded-sm hover:bg-amber-400 transition-colors shadow-glow-gold/20"
                            title="Passer au jour suivant"
                        >
                            <span className="font-bold text-xs uppercase tracking-tighter transition-all">+1J</span>
                        </button>
                    </div>
                </div>
            </div >

            {/* Mois */}
            < div >
                <span className={labelCls}>Mois de l'année ({config.months.length})</span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {config.months.map((m: CalendarMonthDef, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-stone-600 text-xs w-5 text-right flex-shrink-0">{i + 1}.</span>
                            <input
                                value={m.name}
                                onChange={e => updateMonth(i, { name: e.target.value })}
                                placeholder={`Mois ${i + 1}`}
                                className="bg-stone-800 border border-stone-600 rounded-sm px-2 py-1 text-xs text-stone-200 flex-1 focus:outline-none focus:border-amber-gold/60"
                            />
                            <input
                                type="number"
                                min={1}
                                max={999}
                                value={m.days}
                                onChange={e => updateMonth(i, { days: Number(e.target.value) })}
                                className="bg-stone-800 border border-stone-600 rounded-sm px-2 py-1 text-xs text-stone-200 w-20 focus:outline-none focus:border-amber-gold/60 text-center"
                                title="Nombre de jours"
                            />
                            <span className="text-stone-600 text-xs">j.</span>
                            <button onClick={() => removeMonth(i)} className="text-stone-600 hover:text-rose-500 transition-colors flex-shrink-0">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={addMonth} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-400 mt-2 transition-colors">
                    <PlusCircle size={13} /> Ajouter un mois
                </button>
            </div >

            {/* Jours de la semaine */}
            < div >
                <span className={labelCls}>Jours de la semaine ({config.dayNames.length})</span>
                <div className="flex flex-wrap gap-2">
                    {config.dayNames.map((d: string, i: number) => (
                        <div key={i} className="flex items-center gap-1 bg-stone-800 border border-stone-700 rounded-sm px-2 py-1">
                            <input
                                value={d}
                                onChange={e => updateDayName(i, e.target.value)}
                                className="bg-transparent text-xs text-stone-200 w-20 focus:outline-none"
                            />
                            <button onClick={() => removeDay(i)} className="text-stone-600 hover:text-rose-500 transition-colors">
                                <Trash2 size={11} />
                            </button>
                        </div>
                    ))}
                    <button onClick={addDay} className="flex items-center gap-1 text-xs text-stone-500 hover:text-amber-400 transition-colors px-2 py-1 border border-dashed border-stone-700 rounded-sm hover:border-amber-gold/40">
                        <PlusCircle size={12} /> Ajouter
                    </button>
                </div>
            </div >

            {/* Saisons */}
            < div className="border border-stone-700/50 rounded-sm overflow-hidden" >
                <button
                    onClick={() => setSeasonsOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-stone-800/50 hover:bg-stone-800 transition-colors"
                >
                    <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                        Saisons ({config.seasons.length})
                    </span>
                    {seasonsOpen ? <ChevronUp size={15} className="text-stone-500" /> : <ChevronDown size={15} className="text-stone-500" />}
                </button>
                {
                    seasonsOpen && (
                        <div className="p-4 space-y-4">
                            {config.seasons.map((season: CalendarSeason) => (
                                <div key={season.id} className="bg-mystic-deep/60 border border-stone-700/50 rounded-sm p-3 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full border-2 border-stone-600 flex-shrink-0 cursor-pointer"
                                            style={{ backgroundColor: season.color }}
                                            onClick={() => {
                                                const idx = SEASON_COLORS.indexOf(season.color ?? SEASON_COLORS[0]);
                                                updateSeason(season.id, { color: SEASON_COLORS[(idx + 1) % SEASON_COLORS.length] });
                                            }}
                                            title="Cliquer pour changer la couleur"
                                        />
                                        <input
                                            value={season.name}
                                            onChange={e => updateSeason(season.id, { name: e.target.value })}
                                            className="flex-1 bg-stone-800 border border-stone-600 rounded-sm px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-gold/60"
                                            placeholder="Nom de la saison"
                                        />
                                        <button onClick={() => removeSeason(season.id)} className="text-stone-600 hover:text-rose-500 transition-colors">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {config.months.map((m: CalendarMonthDef, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => toggleSeasonMonth(season.id, i)}
                                                className={`px-2 py-0.5 text-xs rounded-sm border transition-all ${season.monthIndices.includes(i)
                                                    ? 'border-transparent text-stone-900 font-bold'
                                                    : 'border-stone-700 text-stone-500 hover:border-stone-500'}`}
                                                style={season.monthIndices.includes(i) ? { backgroundColor: season.color } : {}}
                                            >
                                                {m.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button onClick={addSeason} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-400 transition-colors">
                                <PlusCircle size={13} /> Ajouter une saison
                            </button>
                        </div>
                    )
                }
            </div >

            {/* Événements */}
            < div className="border-t border-stone-700/50 pt-6" >
                <CalendarEventsList
                    events={config.events}
                    mode="fictional"
                    onUpdate={(events: CalendarEvent[]) => onUpdate({ ...config, events })}
                />
            </div >
        </div >
    );
};

export { DEFAULT_DAY_NAMES };
export default FictionalCalendarConfig;
