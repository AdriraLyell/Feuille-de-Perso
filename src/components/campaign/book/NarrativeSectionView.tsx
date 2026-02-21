import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { NodeViewProps } from '@tiptap/core';
import { Sun, Moon, Zap, Navigation, BookOpen, Coffee, Utensils, MoonStar, Calendar, Clock, List } from 'lucide-react';
import { useRules } from '../../../context/RulesContext';

const NarrativeSectionView: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
    const { type, timeSlot, dateStart, dateEnd, time, date, isSection, title } = node.attrs;
    const { rules } = useRules();
    const isReal = rules?.configurations?.calendar?.type === 'real';

    const getIcon = () => {
        if (type === 'flashback') return <Zap size={14} />;
        if (type === 'voyage') return <Navigation size={14} />;
        if (type === 'summary') return <BookOpen size={14} />;

        switch (timeSlot) {
            case 'matin': return <Coffee size={14} />;
            case 'midi': return <Utensils size={14} />;
            case 'soir': return <Moon size={14} />;
            case 'nuit': return <MoonStar size={14} />;
            default: return <Sun size={14} />;
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
        <NodeViewWrapper
            className={`narrative-section my-6 p-4 rounded-xl border ${getColors()} relative group -mx-4 narrative-section-container`}
            data-is-section={isSection ? "true" : "false"}
            data-section-title={title || ""}
        >
            <div className="flex items-center justify-between mb-3 border-b border-current/10 pb-2">
                <div className="flex items-center gap-2 font-serif italic tracking-wider h-6 flex-grow">
                    <div className="flex items-center gap-1.5 opacity-80 shrink-0">
                        {getIcon()}
                        <span className="text-[10px] font-bold uppercase">{getLabel()}</span>
                    </div>

                    <div className="h-4 w-px bg-current/10 mx-1 shrink-0" />

                    {/* Champ de Titre pour le sommaire */}
                    <input
                        type="text"
                        placeholder="Titre de la section..."
                        value={title || ''}
                        onChange={(e) => updateAttributes({ title: e.target.value })}
                        className="bg-transparent border-none p-0 flex-grow text-[11px] font-bold focus:ring-0 placeholder:opacity-30 placeholder:italic min-w-[50px]"
                    />

                    {(type === 'moment' || type === 'flashback' || type === 'voyage') && (
                        <div className="h-4 w-px bg-current/10 mx-1 shrink-0" />
                    )}

                    {/* Time for Moments */}
                    {type === 'moment' && (
                        <div className="flex items-center gap-1 font-normal lowercase opacity-70 pl-1 shrink-0">
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
                                type="text"
                                placeholder={isReal ? "aaaa-mm-jj" : "date"}
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
                                type="text"
                                placeholder={isReal ? "aaaa-mm-jj" : "début"}
                                value={dateStart || ''}
                                onChange={(e) => updateAttributes({ dateStart: e.target.value })}
                                className="bg-transparent border-none p-0 w-[80px] text-[10px] focus:ring-0 cursor-pointer"
                            />
                            <span>au</span>
                            <input
                                type="text"
                                placeholder={isReal ? "aaaa-mm-jj" : "fin"}
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
                        onClick={() => updateAttributes({ isSection: !isSection })}
                        className={`p-1 rounded transition-colors ${isSection ? 'bg-amber-600 text-white' : 'hover:bg-current/10'}`}
                        title={isSection ? "Retirer du sommaire" : "Ajouter au sommaireSectionner"}
                    >
                        <List size={10} />
                    </button>
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
