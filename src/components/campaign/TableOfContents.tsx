import React from 'react';
import { CampaignNoteEntry } from '../../types';
import {
    JOURNAL_PAGE_WIDTH_LANDSCAPE,
    JOURNAL_PAGE_HEIGHT_LANDSCAPE,
    JOURNAL_PAGE_WIDTH_PORTRAIT,
    JOURNAL_PAGE_HEIGHT_PORTRAIT,
    JOURNAL_CONTENT_PADDING_Y,
    JOURNAL_CONTENT_PADDING_X
} from './constants';
import { BookOpen, Bookmark } from 'lucide-react';

interface TableOfContentsProps {
    notes: CampaignNoteEntry[];
    isLandscape: boolean;
    onJumpToPage: (pageIndex: number) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ notes, isLandscape, onJumpToPage }) => {
    const bookmarkedNotes = notes
        .map((note, index) => ({ note, index }))
        .filter(item => item.note.isBookmarked);

    return (
        <div
            className="flex-shrink-0 snap-start relative group/page flex flex-col page-shadow-left"
            style={{
                width: isLandscape ? `${JOURNAL_PAGE_WIDTH_LANDSCAPE}px` : `${JOURNAL_PAGE_WIDTH_PORTRAIT}px`,
                height: isLandscape ? `${JOURNAL_PAGE_HEIGHT_LANDSCAPE}px` : `${JOURNAL_PAGE_HEIGHT_PORTRAIT}px`,
            }}
        >
            <div
                className="h-full flex flex-col bg-[#fdfbf7] overflow-hidden relative"
                style={{ padding: `${JOURNAL_CONTENT_PADDING_Y}px ${JOURNAL_CONTENT_PADDING_X}px` }}
            >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>

                {/* Header */}
                <div className="border-b-2 border-stone-800/20 mb-8 pb-4 flex items-center justify-center shrink-0 z-20">
                    <h2 className="text-3xl font-serif font-black uppercase tracking-[0.2em] text-indigo-950 flex items-center gap-3">
                        <BookOpen size={28} className="text-red-700" />
                        Sommaire
                    </h2>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar z-10">
                    {bookmarkedNotes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 italic text-center p-8">
                            <p className="font-serif text-lg">Aucun signet pour le moment.</p>
                            <p className="text-sm mt-2 font-handwriting text-xl">Marquez vos pages importantes pour les voir apparaître ici.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookmarkedNotes.map((item) => (
                                <button
                                    key={item.note.id}
                                    onClick={() => onJumpToPage(item.index + 1)} // +1 because TOC is page 0
                                    className="w-full group/item flex items-baseline gap-2 text-left hover:bg-stone-100/50 p-2 rounded-sm transition-colors"
                                >
                                    <span className="font-handwriting text-stone-500 text-lg shrink-0 w-24">
                                        {item.note.date}
                                    </span>
                                    <span className="font-serif font-bold text-indigo-900 border-b border-transparent group-hover/item:border-indigo-900/30 flex-grow truncate px-2">
                                        {item.note.title}
                                    </span>
                                    <div className="flex-grow border-b border-dotted border-stone-300 mx-2 mb-1"></div>
                                    <span className="font-serif font-black italic text-stone-400 group-hover/item:text-indigo-950 transition-colors">
                                        p. {item.index + 2}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
                    <BookOpen size={120} strokeWidth={0.5} />
                </div>
            </div>

            {/* Page Number */}
            <div className="absolute bottom-4 left-10 text-[18px] font-serif text-stone-900/40 font-bold italic z-40 pointer-events-none">
                1
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default TableOfContents;
