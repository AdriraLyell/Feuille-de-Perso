
import React, { useState } from 'react';
import { DotEntry } from '../../types';
import DotRating from '../DotRating';
import { SectionHeader } from './Shared';

const DotRow: React.FC<{ 
  entry: DotEntry; 
  category: string; 
  onUpdate: (section: 'skills', category: string, id: string, value: number) => void;
  specializations?: string[];
  theme?: { creationColor: string, xpColor: string };
}> = ({ entry, category, onUpdate, specializations = [], theme }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Spacer logic
    if (!entry.name) {
       return <div className="h-5 border-b border-transparent"></div>;
    }

    const validSpecs = specializations.filter(s => s && s.trim() !== '');
    const hasSpecs = validSpecs.length > 0;

    return (
        <div 
            className="flex justify-between items-center px-2 border-b border-dotted border-stone-300 h-5 hover:bg-stone-50 transition-colors relative group"
            onMouseLeave={() => setIsOpen(false)}
        >
          <span 
            className={`text-xs truncate w-[60%] font-medium transition-colors ${hasSpecs ? 'text-blue-900 font-semibold cursor-help' : 'text-stone-700 cursor-default'}`}
            onClick={() => hasSpecs && setIsOpen(true)}
          >
              {entry.name}
              {hasSpecs && <span className="text-[9px] align-top ml-0.5 text-blue-400">*</span>}
          </span>
          
          {/* Tooltip for Specializations */}
          {isOpen && hasSpecs && (
              <div className="absolute z-[100] left-4 bottom-full mb-1 w-max max-w-[200px] bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl animate-in fade-in zoom-in duration-150 pointer-events-none">
                  <div className="font-bold border-b border-slate-600 mb-1 pb-1 text-slate-300">
                      Spécialisations
                  </div>
                  <ul className="list-disc list-inside space-y-0.5">
                      {validSpecs.map((s, i) => (
                          <li key={i} className="truncate">{s}</li>
                      ))}
                  </ul>
                  {/* Arrow */}
                  <div className="absolute left-6 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
              </div>
          )}

          <DotRating 
            value={entry.value}
            creationValue={entry.creationValue} 
            onChange={(val) => onUpdate('skills', category, entry.id, val)} 
            className="scale-90 origin-right"
            creationColor={theme?.creationColor}
            xpColor={theme?.xpColor}
          />
        </div>
    );
};

export const SkillBlock: React.FC<{ 
  title: string; 
  items: DotEntry[]; 
  cat: string;
  onUpdate: (section: 'skills', category: string, id: string, value: number) => void;
  userSpecs?: Record<string, string[]>;
  imposedSpecs?: Record<string, string[]>;
  theme?: { creationColor: string, xpColor: string };
}> = ({ title, items, cat, onUpdate, userSpecs = {}, imposedSpecs = {}, theme }) => (
    <div className="flex flex-col h-full">
        <SectionHeader title={title} />
        <div className="flex-grow py-1">
            {(items || []).map(item => {
                // Combine specs for this specific item
                const uSpecs = userSpecs[item.id] || [];
                const iSpecs = imposedSpecs[item.id] || [];
                // Imposed specs first, then user specs
                const combinedSpecs = [...iSpecs, ...uSpecs];

                return (
                    <DotRow 
                        key={item.id} 
                        entry={item} 
                        category={cat} 
                        onUpdate={onUpdate} 
                        specializations={combinedSpecs}
                        theme={theme}
                    />
                );
            })}
        </div>
    </div>
  );
