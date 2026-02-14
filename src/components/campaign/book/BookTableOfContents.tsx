import React from 'react';

export interface TOCEntry {
    title: string;
    date: string;
    page: number;
}

interface BookTableOfContentsProps {
    entries: TOCEntry[];
    onNavigate: (page: number) => void;
}

export const BookTableOfContents: React.FC<BookTableOfContentsProps> = ({ entries, onNavigate }) => {
    return (
        <div className="flex flex-col h-full w-full p-12 select-none">
            <h1 className="text-3xl font-serif font-bold text-stone-800 border-b-2 border-amber-900/30 pb-4 mb-8 text-center italic">
                Sommaire
            </h1>

            <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar py-4">
                {entries.length === 0 ? (
                    <p className="text-stone-400 italic text-center py-10 font-serif">
                        Votre récit commence ici...
                    </p>
                ) : (
                    entries.map((entry, index) => (
                        <button
                            key={index}
                            onClick={() => onNavigate(entry.page)}
                            className="group flex items-baseline gap-2 text-left hover:text-amber-700 transition-colors"
                        >
                            <span className="font-serif font-bold text-stone-800 group-hover:text-amber-700 whitespace-nowrap">
                                {entry.title}
                            </span>
                            <div className="flex-grow border-b border-dotted border-stone-300 mx-1 mb-1" />
                            <span className="font-serif text-stone-500 min-w-[2rem] text-right">
                                {entry.page}
                            </span>
                        </button>
                    ))
                )}
            </div>

            <div className="mt-auto pt-8 flex justify-center opacity-30 grayscale pointer-events-none">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-amber-900">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            </div>
        </div>
    );
};
