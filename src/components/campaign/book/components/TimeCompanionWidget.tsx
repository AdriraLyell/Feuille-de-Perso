import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, PenLine, List, Grid3X3, PlusCircle, Clock, Sun, CloudRain, Swords, Moon, Snowflake, Cloud, ArrowDownToLine } from 'lucide-react';
import { CalendarConfig, CalendarEvent } from '../../../../types/rules';

interface TimeCompanionWidgetProps {
    config: CalendarConfig;
    notatedDates?: Map<string, string>;
    voyageRanges?: { start: string, end: string }[];
    onDateClick?: (date: string) => void;
    onNewChapter?: (date: string, atSelection: boolean) => void;
    onClose?: () => void;
}

const WEATHER_ICONS_SMALL: Record<string, any> = {
    'sun': { icon: Sun, color: 'text-amber-500' },
    'rain': { icon: CloudRain, color: 'text-blue-500' },
    'snow': { icon: Snowflake, color: 'text-slate-300' },
    'cloud': { icon: Cloud, color: 'text-stone-400' },
    'combat': { icon: Swords, color: 'text-red-600' },
    'night': { icon: Moon, color: 'text-indigo-400' },
};

const MONTH_NAMES_REAL = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const TimeCompanionWidget: React.FC<TimeCompanionWidgetProps> = ({
    config,
    notatedDates = new Map(),
    voyageRanges = [],
    onDateClick,
    onNewChapter
}) => {
    const isReal = config.type === 'real';
    const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

    const [viewYear, setViewYear] = useState<number>(() => {
        if (isReal) {
            return new Date(config.currentDate || config.startDate || new Date().toISOString()).getFullYear();
        }
        return config.currentYear;
    });

    const [viewMonth, setViewMonth] = useState<number>(() => {
        if (isReal) {
            return new Date(config.currentDate || config.startDate || new Date().toISOString()).getMonth();
        }
        return config.currentMonthIndex;
    });

    const { monthName, dayNames, cells, currentDay, eventsByDay } = useMemo(() => {
        if (isReal) {
            const currentDt = new Date(config.currentDate || config.startDate);
            const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
            const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0

            const evByDay: Record<number, CalendarEvent[]> = {};
            for (const ev of config.events) {
                const [ey, em, ed] = ev.date.split('-').map(Number);
                if (ey === viewYear && (em - 1) === viewMonth) {
                    (evByDay[ed] = evByDay[ed] || []).push(ev);
                }
            }

            const activeDay = (currentDt.getFullYear() === viewYear && currentDt.getMonth() === viewMonth)
                ? currentDt.getDate() : null;

            const cells: (number | null)[] = [];
            for (let i = 0; i < firstWeekday; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);
            while (cells.length % 7 !== 0) cells.push(null);

            return {
                monthName: `${MONTH_NAMES_REAL[viewMonth]} ${viewYear}`,
                dayNames: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
                cells,
                currentDay: activeDay,
                eventsByDay: evByDay
            };
        } else {
            const monthDef = config.months[viewMonth] ?? { name: `Mois ${viewMonth + 1}`, days: 30 };
            const daysInMonth = monthDef.days;
            const dw = config.dayNames.length || 7;

            // Offset calculation for fictional calendar
            let totalDaysBefore = 0;
            const daysPerYear = config.months.reduce((s, m) => s + m.days, 0);
            totalDaysBefore += (viewYear - (config.startYear || 0)) * daysPerYear;
            for (let i = 0; i < viewMonth; i++) totalDaysBefore += (config.months[i]?.days ?? 30);

            const firstWeekday = totalDaysBefore % dw;

            const evByDay: Record<number, CalendarEvent[]> = {};
            for (const ev of config.events) {
                const [ey, em, ed] = ev.date.split('-').map(Number);
                if (ey === viewYear && em - 1 === viewMonth) {
                    (evByDay[ed] = evByDay[ed] || []).push(ev);
                }
            }

            const activeDay = (config.currentMonthIndex === viewMonth && config.currentYear === viewYear)
                ? config.currentDay : null;

            const cells: (number | null)[] = [];
            for (let i = 0; i < firstWeekday; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);
            while (cells.length % dw !== 0) cells.push(null);

            return {
                monthName: `${monthDef.name} ${viewYear}`,
                dayNames: config.dayNames.map(n => n.slice(0, 1).toUpperCase()),
                cells,
                currentDay: activeDay,
                eventsByDay: evByDay
            };
        }
    }, [config, viewYear, viewMonth, isReal]);

    const nextEvent = useMemo(() => {
        if (!config.events || config.events.length === 0) return null;

        const currentDt = isReal
            ? new Date((config as any).currentDate || new Date().toISOString())
            : null;

        if (isReal && currentDt) {
            const upcoming = config.events
                .filter(ev => new Date(ev.date) >= currentDt)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            return upcoming[0] || null;
        } else if (!isReal) {
            // Fictional logic
            const upcoming = [...config.events].sort((a, b) => {
                const [ya, ma, da] = a.date.split('-').map(Number);
                const [yb, mb, db] = b.date.split('-').map(Number);
                if (ya !== yb) return ya - yb;
                if (ma !== mb) return ma - mb;
                return da - db;
            }).filter(ev => {
                const [y, m, d] = ev.date.split('-').map(Number);
                if (y > config.currentYear) return true;
                if (y === config.currentYear && m > config.currentMonthIndex + 1) return true;
                if (y === config.currentYear && m === config.currentMonthIndex + 1 && d >= config.currentDay) return true;
                return false;
            });
            return upcoming[0] || null;
        }
        return null;
    }, [config.events, (config as any).currentDate, (config as any).currentYear, (config as any).currentMonthIndex, (config as any).currentDay, isReal]);

    const daysToNextEvent = useMemo(() => {
        if (!nextEvent) return null;
        if (isReal) {
            const now = new Date((config as any).currentDate || new Date().toISOString());
            const target = new Date(nextEvent.date);
            const diff = target.getTime() - now.getTime();
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        } else {
            // Simple fictional diff (approximate or precise if months are known)
            // For now, just show the date
            return null;
        }
    }, [nextEvent, (config as any).currentDate, isReal]);

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(isReal ? 11 : config.months.length - 1);
            setViewYear(v => v - 1);
        } else {
            setViewMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        const maxM = isReal ? 12 : config.months.length;
        if (viewMonth === maxM - 1) {
            setViewMonth(0);
            setViewYear(v => v + 1);
        } else {
            setViewMonth(m => m + 1);
        }
    };

    return (
        <div
            className="absolute z-50 p-5 bg-stone-950 border border-amber-500/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-right-4 duration-500 w-[340px]"
            style={{ right: '55px', top: '0px' }}
        >
            <div className="flex items-center gap-2 mb-3 border-b border-stone-800 pb-2">
                <CalendarDays size={14} className="text-amber-500" />
                <div className="text-[12px] font-serif font-bold text-amber-500 uppercase tracking-[0.2em] truncate flex-1">
                    Chroniqueur
                </div>
                <button
                    onClick={() => setViewMode(v => v === 'grid' ? 'timeline' : 'grid')}
                    className="p-1 hover:text-amber-400 text-stone-500 transition-colors"
                >
                    {viewMode === 'grid' ? <List size={12} /> : <Grid3X3 size={12} />}
                </button>
            </div>

            {viewMode === 'grid' ? (
                <>
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={prevMonth} className="p-1 hover:text-amber-400 text-stone-600 transition-colors">
                            <ChevronLeft size={14} />
                        </button>
                        <div className="text-[13px] font-bold text-stone-100 uppercase text-center truncate px-2 tracking-widest">
                            {monthName}
                        </div>
                        <button onClick={nextMonth} className="p-1 hover:text-amber-400 text-stone-600 transition-colors">
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="grid gap-0.5 mb-1" style={{ gridTemplateColumns: `repeat(${dayNames.length}, minmax(0, 1fr))` }}>
                        {dayNames.map((d, i) => (
                            <div key={i} className="text-center text-[11px] font-bold text-stone-400 uppercase pb-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${dayNames.length}, minmax(0, 1fr))` }}>
                        {cells.map((day, i) => {
                            if (day === null) return <div key={i} />;
                            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isToday = day === currentDay;
                            const hasEvents = (eventsByDay[day] ?? []).length > 0;
                            const weatherType = notatedDates.get(dateStr);
                            const hasNotes = notatedDates.has(dateStr);
                            const isTraveling = voyageRanges.some(r => dateStr >= r.start && dateStr <= r.end);

                            const WeatherIcon = weatherType ? WEATHER_ICONS_SMALL[weatherType]?.icon : null;
                            const weatherColor = weatherType ? WEATHER_ICONS_SMALL[weatherType]?.color : 'text-amber-500/50';

                            return (
                                <div
                                    key={i}
                                    onClick={() => onDateClick?.(dateStr)}
                                    className={`group relative text-center text-[13px] py-2.5 rounded transition-all font-medium
                                        ${isToday ? 'bg-amber-500 text-stone-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-stone-300 hover:bg-stone-800 hover:text-white'}
                                        ${onDateClick ? 'cursor-pointer hover:ring-2 hover:ring-amber-500' : 'cursor-default'}`}
                                >
                                    {day}
                                    {hasEvents && (
                                        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? 'bg-stone-950' : 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]'}`} />
                                    )}
                                    {isTraveling && !isToday && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500/30" />
                                    )}
                                    {hasNotes && !isToday && (
                                        <div className="absolute top-1 right-1">
                                            {WeatherIcon ? (
                                                <WeatherIcon size={10} className={`${weatherColor} group-hover:opacity-100 transition-opacity drop-shadow-sm`} />
                                            ) : (
                                                <PenLine size={10} className="text-amber-500 group-hover:text-amber-400 transition-colors drop-shadow-sm" />
                                            )}
                                        </div>
                                    )}

                                    {onNewChapter && (
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-stone-950/90 backdrop-blur-[4px] flex items-center justify-center gap-2 transition-all duration-300 rounded-md z-10 border border-amber-500/50 shadow-2xl scale-95 group-hover:scale-100">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onNewChapter?.(dateStr, true); }}
                                                className="w-8 h-8 flex items-center justify-center bg-stone-900 border border-amber-500/20 hover:bg-amber-500 hover:text-stone-950 rounded-full transition-all text-amber-500 group/btn shadow-lg"
                                                title="Insérer au curseur"
                                            >
                                                <PlusCircle size={16} strokeWidth={2.5} />
                                            </button>
                                            <div className="w-[1px] h-4 bg-amber-500/30" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onNewChapter?.(dateStr, false); }}
                                                className="w-8 h-8 flex items-center justify-center bg-stone-900 border border-amber-500/20 hover:bg-amber-500 hover:text-stone-950 rounded-full transition-all text-amber-500 group/btn shadow-lg"
                                                title="Ajouter à la fin du livre"
                                            >
                                                <ArrowDownToLine size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar space-y-2 text-left">
                    {Array.from(notatedDates.keys()).sort().map(date => {
                        const weather = notatedDates.get(date);
                        const WeatherIcon = weather ? WEATHER_ICONS_SMALL[weather]?.icon : null;
                        const weatherColor = weather ? WEATHER_ICONS_SMALL[weather]?.color : 'text-amber-500/40';

                        return (
                            <div
                                key={date}
                                onClick={() => onDateClick?.(date)}
                                className="p-2 bg-stone-800/50 border border-stone-700/50 rounded-lg hover:border-amber-500/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] font-bold text-amber-500/80 font-serif">
                                        {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                    {WeatherIcon ? (
                                        <WeatherIcon size={10} className={`${weatherColor} group-hover:opacity-100 transition-colors`} />
                                    ) : (
                                        <PenLine size={10} className="text-amber-500/40 group-hover:text-amber-500 transition-colors" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {notatedDates.size === 0 && (
                        <div className="text-center py-4 text-[9px] text-stone-500 italic font-serif">
                            Aucune note pour le moment
                        </div>
                    )}
                </div>
            )}

            {/* Next Event Countdown */}
            {nextEvent && (
                <div className="mt-3 pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-stone-500">
                        <Clock size={10} />
                        <span className="text-[8px] uppercase tracking-wider">Prochain</span>
                    </div>
                    <div className="text-[9px] font-bold text-amber-500">
                        {daysToNextEvent !== null ? `J-${daysToNextEvent}` : nextEvent.date}
                    </div>
                </div>
            )}
        </div>
    );
};
