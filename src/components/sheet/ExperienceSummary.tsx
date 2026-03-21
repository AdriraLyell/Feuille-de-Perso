
import React, { useRef, useState } from 'react';
import { SectionHeader } from './Shared';
import { PortalTooltip } from '../ui/PortalTooltip';
import { CardCalculationResult } from '../../types';

interface ExperienceSummaryProps {
    experience: {
        gain: string;
        gainTooltip?: string;
        spent: string;
        rest: string;
    };
    cardValue: CardCalculationResult | string | number | null;
}

const ExperienceSummary = React.memo<ExperienceSummaryProps>(({ experience, cardValue }) => {
    const cardRef = useRef<HTMLButtonElement>(null);
    const [isCardTooltipOpen, setIsCardTooltipOpen] = useState(false);

    const isDetailedCard = cardValue && typeof cardValue === 'object' && 'label' in cardValue;
    const cardDisplay = isDetailedCard ? cardValue.label : (cardValue as string | number);

    return (
        <div className="col-span-2 border-l border-stone-400 flex flex-col h-full bg-slate-50/50">
            <SectionHeader title="Experience" />
            <div className="flex-grow p-0">
                <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs bg-stone-100">
                    <span className="w-16 truncate font-bold text-stone-600 uppercase text-[10px]">Gain</span>
                    <input
                        readOnly
                        className="ml-auto w-20 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting font-bold text-ink text-sm px-1"
                        value={experience.gain}
                        title={experience.gainTooltip || experience.gain}
                    />
                </div>


                <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs">
                    <span className="w-16 truncate font-bold text-stone-400 uppercase text-[10px]">Dépensé</span>
                    <input
                        readOnly
                        className="ml-auto w-20 text-center border-b border-stone-300 text-stone-400 outline-none bg-transparent font-handwriting text-sm px-1"
                        value={experience.spent}
                    />
                </div>


                <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs bg-blue-50">
                    <span className="w-16 truncate font-black text-blue-900 uppercase text-[10px]">Reste</span>
                    <input
                        readOnly
                        className="ml-auto w-20 text-center border-b border-blue-200 font-bold text-blue-900 outline-none bg-transparent font-handwriting text-lg px-1"
                        value={experience.rest}
                    />
                </div>


                {cardValue !== null && (
                    <>
                        <button 
                            type="button"
                            ref={cardRef as React.RefObject<HTMLButtonElement>}
                            className={`w-full outline-none focus:bg-yellow-100 flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs bg-yellow-50 ${isDetailedCard ? 'cursor-help' : ''}`}
                            onClick={() => {
                                if (isDetailedCard) setIsCardTooltipOpen(!isCardTooltipOpen);
                            }}
                            onBlur={() => setIsCardTooltipOpen(false)}
                        >
                            <span className="w-16 truncate font-bold text-yellow-900 uppercase text-[10px] text-left">Cartes</span>
                            <input
                                readOnly
                                className={`ml-auto w-20 text-center border-b border-yellow-200 font-bold text-yellow-900 outline-none bg-transparent font-handwriting text-sm px-1 ${isDetailedCard ? 'cursor-help pointer-events-none' : ''}`}
                                value={cardDisplay}
                            />
                        </button>
                        {isDetailedCard && (
                            <PortalTooltip
                                anchorRef={cardRef}
                                isOpen={isCardTooltipOpen}
                                title="Détail du calcul"
                                maxWidth={250}
                            >
                                <div className="flex flex-col gap-1 w-full min-w-[200px] py-1">
                                    <div className="flex flex-col">
                                        {(cardValue as CardCalculationResult).skills.map((skill, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-[11px] mb-1.5 px-2 border-l border-slate-700/50 ml-1">
                                                <span className="text-slate-300 truncate font-medium flex-1 flex items-center pr-2">
                                                    <span className="text-amber-400/80 mr-2 shrink-0 text-base leading-none translate-y-[1px]">•</span>
                                                    {skill.name}
                                                </span>
                                                <span className="font-bold text-amber-200 text-sm">{skill.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-1 text-right text-[10px] italic text-slate-400 border-t border-slate-700/50 pt-2">
                                        Moyenne retenue : <span className="font-bold text-slate-300">{(cardValue as CardCalculationResult).average.toFixed(2)}</span>
                                    </div>
                                </div>
                            </PortalTooltip>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

export default ExperienceSummary;
