import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { NodeViewProps } from '@tiptap/core';
import { Sun, Moon, Zap, Navigation, BookOpen, Coffee, Utensils, MoonStar, Calendar, Clock } from 'lucide-react';
import { useRules } from '../../../context/RulesContext';

const NarrativeSectionView: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
    const { type, timeSlot, dateStart, dateEnd, time, date } = node.attrs;
    const { rules } = useRules();
    const isReal = rules?.configurations?.calendar?.type === 'real';

    const getIcon = () => {
        if (type === 'flashback') return <Zap size={16} />;
        if (type === 'voyage') return <Navigation size={16} />;
        if (type === 'summary') return <BookOpen size={16} />;

        switch (timeSlot) {
            case 'matin': return <Coffee size={16} />;
            case 'midi': return <Utensils size={16} />;
            case 'soir': return <Moon size={16} />;
            case 'nuit': return <MoonStar size={16} />;
            default: return <Sun size={16} />;
        }
    };

    const getLabel = () => {
        if (type === 'flashback') return 'Flashback';
        if (type === 'voyage') return 'Voyage';
        if (type === 'summary') return 'Résumé de séance';
        return timeSlot ? timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1) : 'Moment';
    };

    const getColors = () => {
        if (type === 'flashback') return 'bg-purple-500/10 border-purple-500/20 text-purple-700';
        if (type === 'voyage') return 'bg-blue-500/10 border-blue-500/20 text-blue-700';
        if (type === 'summary') return 'bg-amber-500/10 border-amber-500/20 text-amber-700';
        return 'bg-stone-500/5 border-stone-800/10 text-stone-600';
    };

    const handleCalendarClick = () => {
        window.dispatchEvent(new CustomEvent('toggle-calendar', { detail: { visible: true } }));
    };

    return (
        <NodeViewWrapper className={`narrative-section my-6 p-4 rounded-xl border ${getColors()} relative group -mx-4`}>
            <div className="flex items-center justify-between mb-3 border-b border-current/10 pb-2">
                <div className="flex items-center gap-2 font-serif font-bold italic text-xs uppercase tracking-wider h-6">
                    {getIcon()}
                    <span>{getLabel()}</span>

                    {/* Time for Moments */}
                    {type === 'moment' && (
                        <div className="flex items-center gap-1 ml-2 font-normal lowercase opacity-70 border-l border-current/20 pl-2">
                            <Clock size={10} />
                            <input
                                type="text"
                                placeholder="--:--"
                                value={time || ''}
                                onChange={(e) => updateAttributes({ time: e.target.value })}
                                className="bg-transparent border-none p-0 w-[40px] text-[10px] focus:ring-0"
                            />
                        </div>
                    )}

                    {/* Date for Flashback */}
                    {type === 'flashback' && (
                        <div className="flex items-center gap-1 ml-2 font-normal lowercase opacity-70 border-l border-current/20 pl-2">
                            <button
                                type="button"
                                onClick={handleCalendarClick}
                                className="hover:text-amber-500 transition-colors"
                            >
                                <Calendar size={10} />
                            </button>
                            <input
                                type={isReal ? "date" : "text"}
                                placeholder={isReal ? "" : "aaaa-mm-jj"}
                                value={date || ''}
                                onChange={(e) => updateAttributes({ date: e.target.value })}
                                className="bg-transparent border-none p-0 w-[80px] text-[10px] focus:ring-0 cursor-pointer"
                            />
                        </div>
                    )}

                    {/* Range for Voyage */}
                    {type === 'voyage' && (
                        <div className="flex items-center gap-1 ml-2 font-normal lowercase opacity-70 border-l border-current/20 pl-2">
                            <button
                                type="button"
                                onClick={handleCalendarClick}
                                className="hover:text-amber-500 transition-colors"
                            >
                                <Calendar size={10} />
                            </button>
                            <input
                                type={isReal ? "date" : "text"}
                                placeholder={isReal ? "" : "début"}
                                value={dateStart || ''}
                                onChange={(e) => updateAttributes({ dateStart: e.target.value })}
                                className="bg-transparent border-none p-0 w-[80px] text-[10px] focus:ring-0 cursor-pointer"
                            />
                            <span>au</span>
                            <input
                                type={isReal ? "date" : "text"}
                                placeholder={isReal ? "" : "fin"}
                                value={dateEnd || ''}
                                onChange={(e) => updateAttributes({ dateEnd: e.target.value })}
                                className="bg-transparent border-none p-0 w-[80px] text-[10px] focus:ring-0 cursor-pointer"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {type === 'moment' && (
                        <>
                            {['matin', 'midi', 'soir', 'nuit'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => updateAttributes({ timeSlot: t })}
                                    className={`p-1 rounded text-[10px] uppercase font-bold ${timeSlot === t ? 'bg-current text-white' : 'hover:bg-current/10'}`}
                                >
                                    {t.slice(0, 1)}
                                </button>
                            ))}
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            const types = ['moment', 'voyage', 'flashback', 'summary'];
                            const next = types[(types.indexOf(type) + 1) % types.length];
                            updateAttributes({ type: next });
                        }}
                        className="p-1 hover:bg-current/10 rounded transition-colors"
                        title="Changer le type"
                    >
                        <Zap size={10} />
                    </button>
                </div>
            </div>

            <div className="text-stone-900 font-serif leading-relaxed italic">
                <NodeViewContent />
            </div>
        </NodeViewWrapper>
    );
};

export default NarrativeSectionView;
