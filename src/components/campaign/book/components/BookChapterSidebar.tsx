import React from 'react';
import { Calendar } from 'lucide-react';

interface BookChapterSidebarProps {
    onInsertChapter: () => void;
    onAppendChapter: () => void;
    onInsertMoment: () => void;
    onInsertTravel: () => void;
    onToggleCalendar: () => void;
    isCalendarVisible: boolean;
    children?: React.ReactNode;
}

export const BookChapterSidebar: React.FC<BookChapterSidebarProps> = ({
    onInsertChapter,
    onAppendChapter,
    onInsertMoment,
    onInsertTravel,
    onToggleCalendar,
    isCalendarVisible,
    children
}) => {
    return (
        <div
            className="absolute z-50 flex flex-col items-center gap-3 p-2 bg-stone-900/90 border border-amber-600/30 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4 duration-500"
            style={{ right: '-65px', top: '220px' }}
        >
            <button
                onClick={onToggleCalendar}
                className={`p-2.5 rounded-lg transition-all border shadow-lg group relative ${isCalendarVisible ? 'bg-amber-600 text-stone-950 border-amber-400' : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-amber-400'}`}
                title={isCalendarVisible ? "Masquer le Chroniqueur" : "Afficher le Chroniqueur"}
            >
                <Calendar size={20} strokeWidth={isCalendarVisible ? 3 : 2} />
                <div className="absolute right-full mr-3 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {isCalendarVisible ? "Masquer le Chroniqueur" : "Afficher le Chroniqueur"}
                </div>
            </button>

            <div className="w-8 h-px bg-stone-700/50 my-1" />

            {isCalendarVisible && children}
            {isCalendarVisible && children && <div className="w-8 h-px bg-stone-700/50 my-1" />}

            <div className="text-[9px] font-serif font-bold text-amber-500/50 uppercase tracking-widest vertical-text py-2">
                Actions
            </div>
            <div className="w-8 h-px bg-stone-700/50" />
            <button
                onClick={onInsertChapter}
                className="p-2.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-amber-400 transition-all border border-stone-700 hover:border-amber-600/50 shadow-lg group relative"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                <div className="absolute right-full mr-3 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Insérer Chapitre
                </div>
            </button>

            <button
                onClick={onAppendChapter}
                className="p-2.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-amber-400 transition-all border border-stone-700 hover:border-amber-600/50 shadow-lg group relative"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                <div className="absolute right-full mr-3 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Nouveau Chapitre (Fin)
                </div>
            </button>

            <div className="w-8 h-px bg-stone-700/50 my-1" />

            <button
                onClick={onInsertMoment}
                className="p-2.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-amber-400 transition-all border border-stone-700 hover:border-amber-600/50 shadow-lg group relative"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z" /></svg>
                <div className="absolute right-full mr-3 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Insérer Moment
                </div>
            </button>

            <button
                onClick={onInsertTravel}
                className="p-2.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-amber-400 transition-all border border-stone-700 hover:border-amber-600/50 shadow-lg group relative"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5c0-1.1.9-2 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="3" /><path d="m16 16-1.9-1.9" /></svg>
                <div className="absolute right-full mr-3 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Insérer Voyage
                </div>
            </button>
        </div>
    );
};
