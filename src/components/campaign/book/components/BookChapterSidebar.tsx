import React from 'react';
import { Calendar } from 'lucide-react';

interface BookChapterSidebarProps {
    onInsertMoment: () => void;
    onToggleCalendar: () => void;
    isCalendarVisible: boolean;
    children?: React.ReactNode;
}

export const BookChapterSidebar: React.FC<BookChapterSidebarProps> = ({
    onInsertMoment,
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
            {isCalendarVisible && children}

            <button
                onClick={onInsertMoment}
                className="p-2.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-amber-400 transition-all border border-stone-700 hover:border-amber-600/50 shadow-lg group relative"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z" /></svg>
                <div className="absolute right-full mr-3 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Bloc Narratif
                </div>
            </button>
        </div>
    );
};
