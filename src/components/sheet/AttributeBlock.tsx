
import React, { useRef } from 'react';
import { AttributeEntry, BonusInfo } from '../../types';
import { SectionHeader } from './Shared';

const AttributeRow: React.FC<{ 
    entry: AttributeEntry, 
    category: string,
    onUpdate: (category: string, id: string, field: 'val1' | 'val2' | 'val3', value: string) => void;
    bonus?: BonusInfo;
}> = ({ entry, category, onUpdate, bonus }) => {
    const ref1 = useRef<HTMLInputElement>(null);
    const ref2 = useRef<HTMLInputElement>(null);
    const ref3 = useRef<HTMLInputElement>(null);

    const bonusValue = bonus?.value || 0;
    
    // Parse strings safely for total calculation
    const v1 = parseInt(entry.val1) || 0;
    const v2 = parseInt(entry.val2) || 0;
    const v3 = parseInt(entry.val3) || 0;
    
    const baseTotal = v1 + v2 + v3;
    const total = baseTotal + bonusValue;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextRef?: React.RefObject<HTMLInputElement>) => {
        if (e.key === 'Enter') {
             e.preventDefault();
             if (nextRef && nextRef.current) {
                 nextRef.current.focus();
             } else {
                 e.currentTarget.blur();
             }
        }
    };

    // Construct tooltip text
    let tooltip = `Total : ${total}`;
    if (bonusValue !== 0 && bonus) {
        tooltip = `Base : ${baseTotal}\nModificateurs : ${bonusValue > 0 ? '+' : ''}${bonusValue}\n\nSources :\n${bonus.sources.map(s => `- ${s}`).join('\n')}`;
    }

    return (
      <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs hover:bg-stone-50 transition-colors">
          <span className="w-24 truncate font-semibold text-stone-700">{entry.name}</span>
          <div className="flex items-center gap-1 flex-grow justify-end">
              <input 
                  ref={ref1}
                  className="w-6 h-5 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting text-ink text-sm hover:bg-white/50 no-spinner"
                  value={entry.val1}
                  onChange={(e) => onUpdate(category, entry.id, 'val1', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, ref2)}
                  onFocus={(e) => e.target.select()}
                  placeholder=""
                  type="text"
                  inputMode="numeric"
              />
              <span className="text-stone-400 font-handwriting">+</span>
              <input 
                  ref={ref2}
                  className="w-6 h-5 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting text-ink text-sm hover:bg-white/50 no-spinner"
                  value={entry.val2}
                  onChange={(e) => onUpdate(category, entry.id, 'val2', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, ref3)}
                  onFocus={(e) => e.target.select()}
                  placeholder=""
                  type="text"
                  inputMode="numeric"
              />
              <span className="text-stone-400 font-handwriting">+</span>
              <input 
                  ref={ref3}
                  className="w-6 h-5 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting text-ink text-sm hover:bg-white/50 no-spinner"
                  value={entry.val3}
                  onChange={(e) => onUpdate(category, entry.id, 'val3', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e)}
                  onFocus={(e) => e.target.select()}
                  placeholder=""
                  type="text"
                  inputMode="numeric"
              />
              
              <span className="text-stone-400 font-handwriting">=</span>
              <div 
                className={`w-7 h-5 flex items-center justify-center font-bold rounded border shadow-sm ml-1 font-handwriting text-sm cursor-help transition-colors ${
                    bonusValue > 0 ? 'bg-green-100 text-green-900 border-green-300' :
                    bonusValue < 0 ? 'bg-red-100 text-red-900 border-red-300' :
                    'bg-blue-50 text-blue-900 border-blue-100'
                }`}
                title={tooltip}
              >
                  {total}
              </div>
          </div>
      </div>
    );
};

export const AttributeBlock: React.FC<{ 
  title: string; 
  items: AttributeEntry[]; 
  cat: string; 
  onUpdate: (category: string, id: string, field: 'val1' | 'val2' | 'val3', value: string) => void;
  bonuses: Record<string, BonusInfo>;
  secondaryItems?: AttributeEntry[];
}> = ({ title, items, cat, onUpdate, bonuses, secondaryItems }) => {
  return (
      <div className="flex flex-col border-r last:border-r-0 border-stone-400 h-full">
        <SectionHeader title={title} />
        <div className="flex-grow p-0">
          {(items || []).map(item => (
            <AttributeRow 
               key={item.id} 
               entry={item} 
               category={cat} 
               onUpdate={onUpdate}
               bonus={bonuses[item.name.trim().toLowerCase()]}
            />
          ))}
          
          {secondaryItems && secondaryItems.length > 0 && (
              <>
                {/* Visual Demarcation */}
                <div className="h-px bg-stone-300 border-t border-dotted border-stone-400 mx-1 my-0.5"></div>
                {secondaryItems.map(item => (
                    <AttributeRow 
                        key={item.id} 
                        entry={item} 
                        category={cat} 
                        onUpdate={onUpdate}
                        bonus={bonuses[item.name.trim().toLowerCase()]}
                    />
                ))}
              </>
          )}
        </div>
      </div>
  );
};
