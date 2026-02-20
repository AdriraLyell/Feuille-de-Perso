import React, { useMemo } from 'react';
import { CalendarConfigReal, CalendarEvent } from '../../../types/rules';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

interface Props {
    config: CalendarConfigReal | { type: 'fictional'; months: { name: string; days: number }[]; dayNames: string[]; currentMonthIndex: number; currentYear: number; currentDay: number; events: CalendarEvent[] };
    mode: 'real' | 'fictional';
}

const CalendarPreview: React.FC<Props> = ({ config, mode }) => {
    const [viewYear, setViewYear] = React.useState<number>(() => {
        if (mode === 'real') {
            const cfg = config as CalendarConfigReal;
            return new Date(cfg.currentDate || cfg.startDate || new Date().toISOString()).getFullYear();
        }
        const cfg = config as Extract<typeof config, { type: 'fictional' }>;
        return cfg.currentYear;
    });
    const [viewMonth, setViewMonth] = React.useState<number>(() => {
        if (mode === 'real') {
            const cfg = config as CalendarConfigReal;
            return new Date(cfg.currentDate || cfg.startDate || new Date().toISOString()).getMonth();
        }
        const cfg = config as Extract<typeof config, { type: 'fictional' }>;
        return cfg.currentMonthIndex;
    });

    const { days, firstWeekday, monthName, dayNames, daysInMonth, eventsByDay, currentDay } = useMemo(() => {
        if (mode === 'real') {
            const cfg = config as CalendarConfigReal;
            const currentDt = new Date(cfg.currentDate || cfg.startDate);
            const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
            const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0
            const evByDay: Record<number, CalendarEvent[]> = {};
            for (const ev of cfg.events) {
                const d = new Date(ev.date);
                if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
                    const day = d.getDate();
                    (evByDay[day] = evByDay[day] || []).push(ev);
                }
            }
            const isCurrent = (currentDt.getFullYear() === viewYear && currentDt.getMonth() === viewMonth)
                ? currentDt.getDate() : null;
            return { days: dim, firstWeekday: firstDow, monthName: MONTH_NAMES[viewMonth], dayNames: WEEKDAY_NAMES, daysInMonth: dim, eventsByDay: evByDay, currentDay: isCurrent };
        }

        const cfg = config as Extract<typeof config, { type: 'fictional' }>;
        const monthDef = cfg.months[viewMonth] ?? { name: `Mois ${viewMonth + 1}`, days: 30 };
        const dim = monthDef.days;
        const dw = cfg.dayNames.length || 7;
        // Pour fictif, le premier jour du mois = on calcule l'offset depuis l'année de départ
        const totalDaysBefore = (() => {
            let total = 0;
            const daysPerYear = cfg.months.reduce((s: number, m: { days: number }) => s + m.days, 0);
            total += (cfg.currentYear - ((cfg as { startYear?: number }).startYear ?? 0)) * daysPerYear;
            for (let i = 0; i < viewMonth; i++) total += (cfg.months[i]?.days ?? 30);
            return total;
        })();
        const firstDow = totalDaysBefore % dw;
        const evByDay: Record<number, CalendarEvent[]> = {};
        for (const ev of cfg.events) {
            const [ey, em, ed] = ev.date.split('-').map(Number);
            if (ey === cfg.currentYear && em - 1 === viewMonth) {
                (evByDay[ed] = evByDay[ed] || []).push(ev);
            }
        }
        return { days: dim, firstWeekday: firstDow, monthName: monthDef.name, dayNames: cfg.dayNames.map((n: string) => n.slice(0, 3)), daysInMonth: dim, eventsByDay: evByDay, currentDay: (cfg.currentMonthIndex === viewMonth ? cfg.currentDay : null) };
    }, [config, mode, viewYear, viewMonth]);

    const totalCols = dayNames.length;
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % totalCols !== 0) cells.push(null);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(mode === 'real' ? 11 : ((config as any).months?.length ?? 12) - 1); setViewYear(v => v - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        const maxM = mode === 'real' ? 12 : ((config as any).months?.length ?? 12);
        if (viewMonth === maxM - 1) { setViewMonth(0); setViewYear(v => v + 1); }
        else setViewMonth(m => m + 1);
    };

    return (
        <div className="bg-mystic-deep border border-stone-700/50 rounded-sm p-4 min-w-[280px]">
            {/* Header nav */}
            <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1 hover:text-amber-400 text-stone-500 transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-amber-gold uppercase tracking-wider">
                    {monthName} {viewYear}
                </span>
                <button onClick={nextMonth} className="p-1 hover:text-amber-400 text-stone-500 transition-colors">
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Grid header */}
            <div className="grid gap-0.5 mb-1" style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}>
                {dayNames.map((d: string) => (
                    <div key={d} className="text-center text-[10px] font-bold text-stone-500 uppercase py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid cells */}
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}>
                {cells.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const isToday = day === currentDay;
                    const events = eventsByDay[day] ?? [];
                    return (
                        <div
                            key={i}
                            className={`relative text-center text-xs py-1 rounded-sm transition-colors cursor-default
                                ${isToday ? 'bg-amber-gold/20 text-amber-gold font-bold ring-1 ring-amber-gold/40' : 'text-stone-300 hover:bg-stone-700/50'}`}
                        >
                            {day}
                            {events.length > 0 && (
                                <span
                                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                    style={{ backgroundColor: events[0].color ?? '#f59e0b' }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarPreview;
