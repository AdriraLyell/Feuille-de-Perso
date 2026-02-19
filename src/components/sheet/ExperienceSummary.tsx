
import React from 'react';
import { SectionHeader } from './Shared';

interface ExperienceSummaryProps {
    experience: {
        gain: string;
        gainTooltip?: string;
        spent: string;
        rest: string;
    };
    cardValue: number | string | null;
}

const ExperienceSummary: React.FC<ExperienceSummaryProps> = ({ experience, cardValue }) => {
    return (
        <div className="col-span-2 border-l border-stone-400 flex flex-col h-full bg-slate-50/50">
            <SectionHeader title="Experience" />
            <div className="flex-grow p-0">
                <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs bg-stone-100">
                    <span className="w-16 truncate font-bold text-stone-600 uppercase text-[10px]">Gain</span>
                    <div className="flex-grow flex justify-end">
                        <input
                            readOnly
                            className="w-full text-right border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting font-bold text-ink text-sm px-1"
                            value={experience.gain}
                            title={experience.gainTooltip || experience.gain}
                        />
                    </div>
                </div>
                <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs">
                    <span className="w-16 truncate font-bold text-stone-400 uppercase text-[10px]">Dépensé</span>
                    <div className="flex-grow flex justify-end">
                        <input
                            readOnly
                            className="w-20 text-center border-b border-stone-300 text-stone-400 outline-none bg-transparent font-handwriting text-sm"
                            value={experience.spent}
                        />
                    </div>
                </div>
                <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs bg-blue-50">
                    <span className="w-16 truncate font-black text-blue-900 uppercase text-[10px]">Reste</span>
                    <div className="flex-grow flex justify-end">
                        <input
                            readOnly
                            className="w-20 text-center border-b border-blue-200 font-bold text-blue-900 outline-none bg-transparent font-handwriting text-lg"
                            value={experience.rest}
                        />
                    </div>
                </div>
                {cardValue !== null && (
                    <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs bg-yellow-50">
                        <span className="w-16 truncate font-bold text-yellow-900 uppercase text-[10px]">Cartes</span>
                        <div className="flex-grow flex justify-end">
                            <input
                                readOnly
                                className="w-20 text-center border-b border-yellow-200 font-bold text-yellow-900 outline-none bg-transparent font-handwriting text-sm"
                                value={cardValue}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExperienceSummary;
