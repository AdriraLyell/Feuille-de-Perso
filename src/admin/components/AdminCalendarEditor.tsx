import React from 'react';
import { CalendarConfig, CalendarConfigFictional, CalendarConfigReal, CalendarSeason, RulesData } from '../../types/rules';
import { CalendarDays, Globe, Sparkles } from 'lucide-react';
import RealCalendarConfig from './calendar/RealCalendarConfig';
import FictionalCalendarConfig, { DEFAULT_DAY_NAMES } from './calendar/FictionalCalendarConfig';
import CalendarPreview from './calendar/CalendarPreview';
import { MotionFade } from '../../components/ui/motion/MotionFade';

interface Props {
    rules: RulesData;
    onUpdate: (rules: RulesData) => void;
}

const DEFAULT_FICTIONAL: CalendarConfigFictional = {
    type: 'fictional',
    startYear: 1,
    currentYear: 1,
    currentMonthIndex: 0,
    currentDay: 1,
    months: Array.from({ length: 12 }, (_: unknown, i: number) => ({ name: `Mois ${i + 1}`, days: 30 })),
    dayNames: DEFAULT_DAY_NAMES,
    seasons: [],
    events: [],
};

const DEFAULT_REAL: CalendarConfigReal = {
    type: 'real',
    startDate: '',
    currentDate: '',
    events: [],
};

const AdminCalendarEditor: React.FC<Props> = ({ rules, onUpdate }) => {
    const calendar = rules.configurations.calendar;

    const updateCalendar = (cal: CalendarConfig) => {
        onUpdate({
            ...rules,
            configurations: { ...rules.configurations, calendar: cal },
            lastUpdated: Date.now()
        });
    };

    const selectType = (type: 'real' | 'fictional') => {
        if (type === 'real') {
            updateCalendar(calendar?.type === 'real' ? calendar : { ...DEFAULT_REAL });
        } else {
            updateCalendar(calendar?.type === 'fictional' ? calendar : { ...DEFAULT_FICTIONAL });
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-stone-700 pb-4">
                <CalendarDays size={22} className="text-amber-gold" />
                <div>
                    <h2 className="text-2xl font-serif font-bold text-amber-gold">Calendrier de Campagne</h2>
                    <p className="text-xs text-stone-500 mt-0.5">Configurez le système temporel de votre univers.</p>
                </div>
            </div>

            {/* Sélection du type */}
            <MotionFade delay={0.05}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Carte Réel */}
                    <button
                        onClick={() => selectType('real')}
                        className={`relative flex items-start gap-4 p-5 rounded-sm border-2 text-left transition-all group
                            ${calendar?.type === 'real'
                                ? 'border-amber-gold bg-amber-900/10 shadow-glow-gold'
                                : 'border-stone-700 hover:border-stone-500 bg-mystic-deep/40 hover:bg-mystic-deep/60'
                            }`}
                    >
                        <Globe size={28} className={`mt-0.5 flex-shrink-0 transition-colors ${calendar?.type === 'real' ? 'text-amber-gold' : 'text-stone-500 group-hover:text-stone-300'}`} />
                        <div>
                            <div className={`font-bold text-sm uppercase tracking-widest mb-1 ${calendar?.type === 'real' ? 'text-amber-gold' : 'text-stone-300'}`}>
                                Calendrier Réel
                            </div>
                            <p className="text-xs text-stone-500 leading-relaxed">
                                Ancrez votre campagne dans le temps historique. Saisissez une date initiale et les jours de la semaine correspondent au calendrier grégorien.
                            </p>
                        </div>
                        {calendar?.type === 'real' && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-gold" />
                        )}
                    </button>

                    {/* Carte Fictif */}
                    <button
                        onClick={() => selectType('fictional')}
                        className={`relative flex items-start gap-4 p-5 rounded-sm border-2 text-left transition-all group
                            ${calendar?.type === 'fictional'
                                ? 'border-amber-gold bg-amber-900/10 shadow-glow-gold'
                                : 'border-stone-700 hover:border-stone-500 bg-mystic-deep/40 hover:bg-mystic-deep/60'
                            }`}
                    >
                        <Sparkles size={28} className={`mt-0.5 flex-shrink-0 transition-colors ${calendar?.type === 'fictional' ? 'text-amber-gold' : 'text-stone-500 group-hover:text-stone-300'}`} />
                        <div>
                            <div className={`font-bold text-sm uppercase tracking-widest mb-1 ${calendar?.type === 'fictional' ? 'text-amber-gold' : 'text-stone-300'}`}>
                                Calendrier Fictif
                            </div>
                            <p className="text-xs text-stone-500 leading-relaxed">
                                Créez un système temporel unique : nommez vos mois (jours variables), vos jours de la semaine, définissez des saisons et des événements marquants.
                            </p>
                        </div>
                        {calendar?.type === 'fictional' && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-gold" />
                        )}
                    </button>
                </div>
            </MotionFade>

            {/* État vide */}
            {!calendar && (
                <MotionFade delay={0.1}>
                    <div className="text-center py-16 text-stone-600">
                        <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Sélectionnez un type de calendrier ci-dessus pour commencer.</p>
                    </div>
                </MotionFade>
            )}

            {/* Configuration + Aperçu */}
            {calendar && (
                <MotionFade delay={0.15}>
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                        {/* Formulaire de config (3/5) */}
                        <div className="xl:col-span-3 bg-mystic-surface border border-stone-700/50 rounded-sm p-6 shadow-glass">
                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="text-amber-gold">●</span>
                                {calendar.type === 'real' ? 'Configuration' : 'Structure & Nommage'}
                            </h3>
                            {calendar.type === 'real' ? (
                                <RealCalendarConfig
                                    config={calendar}
                                    onUpdate={updateCalendar}
                                />
                            ) : (
                                <FictionalCalendarConfig
                                    config={calendar}
                                    onUpdate={updateCalendar}
                                />
                            )}
                        </div>

                        {/* Aperçu (2/5) */}
                        <div className="xl:col-span-2 space-y-4">
                            <div className="bg-mystic-surface border border-stone-700/50 rounded-sm p-6 shadow-glass">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="text-amber-gold">●</span> Aperçu
                                </h3>
                                <CalendarPreview
                                    config={calendar as CalendarConfig}
                                    mode={calendar.type}
                                />
                            </div>

                            {/* Résumé saisons (fictif) */}
                            {calendar.type === 'fictional' && calendar.seasons.length > 0 && (
                                <div className="bg-mystic-surface border border-stone-700/50 rounded-sm p-4 shadow-glass">
                                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Saisons</h4>
                                    <div className="space-y-1.5">
                                        {calendar.seasons.map((s: CalendarSeason) => (
                                            <div key={s.id} className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                                <span className="text-xs text-stone-300">{s.name}</span>
                                                <span className="text-xs text-stone-600 ml-auto">
                                                    {s.monthIndices.map((i: number) => calendar.months[i]?.name ?? '?').join(', ')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </MotionFade>
            )}
        </div>
    );
};

export default AdminCalendarEditor;
