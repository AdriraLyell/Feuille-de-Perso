
import React from 'react';
import { BookOpen } from 'lucide-react';

export const Page2SectionHeader: React.FC<{ title: string, total?: number, totalColor?: string, onOpenLibrary?: () => void }> = ({ title, total, totalColor, onOpenLibrary }) => (
    <div className="bg-slate-200 text-slate-800 relative text-center font-bold text-xs border-b border-stone-500 uppercase py-0.5 tracking-wide flex items-center justify-center min-h-[1.5rem] shrink-0 group">
        {total !== undefined && (
            <div className="absolute left-0 top-0 bottom-0 flex items-center h-full">
                <span
                    className={`w-8 flex-shrink-0 flex justify-center items-center bg-white border-r border-stone-300 text-xs h-full font-bold ${totalColor || 'text-stone-800'}`}
                    title="Total"
                >
                    {total}
                </span>
            </div>
        )}
        <span>{title}</span>

        {onOpenLibrary && (
            <div className="absolute right-0 top-0 bottom-0 border-l border-stone-500 flex items-center bg-white/20">
                <button
                    onClick={onOpenLibrary}
                    className="p-1 px-1.5 hover:bg-white text-stone-500 hover:text-blue-600 transition-colors h-full"
                    title="Ouvrir la bibliothèque"
                >
                    <BookOpen size={14} />
                </button>
            </div>
        )}
    </div>
);

export const LineInput: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => (
    <input
        className="w-full bg-transparent border-b border-stone-300 px-1 font-handwriting focus:bg-blue-50 focus:border-blue-300 focus:outline-none text-ink h-[22px]"
        style={{ fontSize: '0.9rem' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
    />
);
