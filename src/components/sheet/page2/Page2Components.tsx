
import React from 'react';
import { BookOpen } from 'lucide-react';

export const Page2SectionHeader: React.FC<{ title: string, total?: number, totalColor?: string, onOpenLibrary?: () => void }> = ({ title, total, totalColor, onOpenLibrary }) => (
  <div className="bg-slate-200 text-slate-800 relative text-center font-bold text-xs border-y border-stone-500 uppercase py-0.5 tracking-wide mb-0.5 flex items-center justify-center min-h-[1.5rem] shrink-0 shadow-sm group">
    {total !== undefined && (
        <div className="absolute left-1 top-0 bottom-0 flex items-center">
            <span 
                className={`w-8 flex justify-center items-center bg-white border border-stone-400 rounded-sm text-xs h-5 font-bold shadow-sm ${totalColor || 'text-stone-800'}`}
                title="Total"
            >
                {total}
            </span>
        </div>
    )}
    <span>{title}</span>
    
    {onOpenLibrary && (
        <button 
            onClick={onOpenLibrary}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white text-stone-500 hover:text-blue-600 transition-colors"
            title="Ouvrir la bibliothèque"
        >
            <BookOpen size={14} />
        </button>
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
