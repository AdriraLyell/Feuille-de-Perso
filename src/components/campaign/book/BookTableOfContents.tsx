import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface TOCEntry {
    type: 'act' | 'chapter' | 'section';
    title: string;
    date: string;
    page: number;
}

interface BookTableOfContentsProps {
    entries: TOCEntry[];
    onNavigate: (page: number) => void;
}

interface ActGroup {
    actEntry?: TOCEntry;
    items: TOCEntry[];
}

export const BookTableOfContents: React.FC<BookTableOfContentsProps> = ({ entries, onNavigate }) => {
    const actGroups = useMemo(() => {
        const groups: ActGroup[] = [];
        let currentGroup: ActGroup = { items: [] };

        entries.forEach(entry => {
            if (entry.type === 'act') {
                if (currentGroup.actEntry || currentGroup.items.length > 0) {
                    groups.push(currentGroup);
                }
                currentGroup = { actEntry: entry, items: [] };
            } else {
                currentGroup.items.push(entry);
            }
        });

        if (currentGroup.actEntry || currentGroup.items.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    }, [entries]);

    const [activeGroupIndex, setActiveGroupIndex] = useState<number>(-1);

    const handleToggleAct = (e: React.MouseEvent | React.KeyboardEvent, index: number) => {
        e.stopPropagation();
        setActiveGroupIndex(index === activeGroupIndex ? -1 : index);
    };

    return (
        <div className="flex flex-col h-full w-full p-12 pr-6 select-none relative">
            <h1 className="text-3xl font-serif font-black text-stone-800 border-b-2 border-amber-900/30 pb-4 mb-4 text-center uppercase tracking-widest">
                Sommaire
            </h1>

            <div
                className="flex flex-col gap-2 overflow-y-auto no-scrollbar py-6 pr-6 h-full"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent, black 25px, black calc(100% - 25px), transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25px, black calc(100% - 25px), transparent)'
                }}
            >
                {entries.length === 0 ? (
                    <p className="text-stone-400 italic text-center py-10 font-serif">
                        Votre récit commence ici...
                    </p>
                ) : (
                    actGroups.map((group, groupIndex) => {
                        const isExpanded = activeGroupIndex === groupIndex;
                        const hasAct = !!group.actEntry;

                        return (
                            <div key={groupIndex} className="flex flex-col mb-4">
                                {hasAct && (
                                    <div className="group w-full flex items-center justify-between text-left py-2 mb-2">
                                        <div
                                            className="flex items-center gap-2 flex-grow cursor-pointer transition-colors"
                                            onClick={(e) => handleToggleAct(e, groupIndex)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleAct(e, groupIndex); }}
                                            role="button"
                                            tabIndex={0}
                                            aria-expanded={isExpanded}
                                        >
                                            <div className="p-1 hover:bg-amber-100 rounded transition-colors text-amber-700">
                                                {isExpanded ? (
                                                    <ChevronDown size={18} className="transition-transform" />
                                                ) : (
                                                    <ChevronRight size={18} className="transition-transform" />
                                                )}
                                            </div>
                                            <span className="font-serif font-bold text-lg text-stone-900 uppercase">
                                                {group.actEntry!.title}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="font-serif text-amber-800/60 min-w-[2rem] text-right font-bold text-sm cursor-pointer hover:text-amber-700 outline-none"
                                            onClick={() => onNavigate(group.actEntry!.page)}
                                        >
                                            {group.actEntry!.page}
                                        </button>
                                    </div>
                                )}

                                <div
                                    className={`flex flex-col gap-3 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded || !hasAct ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'}`}
                                >
                                    {group.items.map((entry, itemIndex) => {
                                        const isSection = entry.type === 'section';
                                        return (
                                            <button
                                                key={itemIndex}
                                                type="button"
                                                onClick={() => onNavigate(entry.page)}
                                                className={`group flex items-baseline gap-2 text-left hover:text-amber-700 transition-colors w-full outline-none ${isSection ? 'pl-8 opacity-70' : hasAct ? 'pl-6' : 'pl-2'}`}
                                            >
                                                <span className={`font-serif group-hover:text-amber-700 whitespace-nowrap truncate max-w-[80%] pt-1 ${isSection ? 'text-sm text-stone-600 italic' : 'font-semibold text-stone-800'}`}>
                                                    {isSection && '•'} {entry.title}
                                                </span>
                                                <div className="flex-grow border-b border-dotted border-stone-300 mx-1 mb-[5px]" />
                                                <span className="font-serif text-stone-500 min-w-[2rem] text-right text-sm">
                                                    {entry.page}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Custom decorative scroll line on the right */}
            <div className="absolute right-6 top-24 bottom-24 w-px bg-gradient-to-b from-transparent via-amber-900/10 to-transparent pointer-events-none" />
        </div>
    );
};
