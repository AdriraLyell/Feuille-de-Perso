
import React from 'react';
import { CharacterSheetData, DotEntry } from '../../types';
import DotRating from '../DotRating';
import { SectionHeader } from './Shared';

interface CountersSectionProps {
    data: CharacterSheetData;
    updateCounter: (id: string, value: number, isCustom: boolean, field: 'value' | 'current') => void;
    isLandscape: boolean;
}

export const CountersSection: React.FC<CountersSectionProps> = ({ data, updateCounter, isLandscape }) => {
    const renderCounterItem = (counter: DotEntry, isCustom: boolean) => (
        <div key={counter.id} className="col-span-1 border border-stone-300 bg-white rounded-sm shadow-sm flex items-center p-1 overflow-hidden h-9">
           {/* Title on the left */}
           <div className="w-16 shrink-0 font-bold text-[9px] uppercase tracking-tighter text-stone-800 border-r border-stone-200 mr-1 pr-1 h-full flex items-center break-words leading-none justify-center text-center">
               {counter.name}
           </div>
           
           {/* Right side stacks */}
           <div className="flex flex-col gap-0.5 flex-grow justify-center w-full">
               {/* Maxi */}
               <div className="flex items-center justify-end h-3 pr-1 gap-2">
                   <span className="text-[8px] text-stone-400 font-bold uppercase tracking-tight">Maxi</span>
                   <div className="relative w-[142px] h-3">
                       <div className="absolute right-0 top-1/2 -translate-y-1/2 scale-[0.9] origin-right">
                          <DotRating 
                              value={counter.value} 
                              creationValue={counter.creationValue} 
                              max={10} 
                              onChange={(v) => updateCounter(counter.id, v, isCustom, 'value')} 
                              creationColor={data.theme?.creationColor}
                              xpColor={data.theme?.xpColor}
                           />
                       </div>
                   </div>
               </div>
               {/* Utilisé */}
               <div className="flex items-center justify-end h-3 pr-1 gap-2">
                   <span className="text-[8px] text-stone-400 font-bold uppercase tracking-tight">Utilisé</span>
                   <div className="relative w-[142px] h-3">
                       <div className="absolute right-0 top-1/2 -translate-y-1/2 scale-[0.9] origin-right flex items-center space-x-1">
                          {Array.from({ length: 10 }).map((_, i) => {
                              if (i >= counter.value) {
                                  return <div key={i} className="w-3 h-3" />;
                              }
                              const isChecked = i < (counter.current || 0);
                              
                              return (
                                  <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                          const newVal = i + 1;
                                          const currentVal = counter.current || 0;
                                          updateCounter(counter.id, newVal === currentVal ? newVal - 1 : newVal, isCustom, 'current');
                                      }}
                                      className={`w-3 h-3 border border-stone-600 transition-colors ${isChecked ? 'bg-ink' : 'bg-white hover:bg-stone-100'}`}
                                      title="Point utilisé"
                                  />
                              );
                          })}
                       </div>
                   </div>
               </div>
           </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full border-l border-stone-400">
            <SectionHeader title="Compteurs" />
            <div className="p-1 flex-grow overflow-y-auto bg-stone-50/30">
               <div className={`grid gap-1 ${isLandscape ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {renderCounterItem(data.counters.volonte, false)}
                  {renderCounterItem(data.counters.confiance, false)}
                  {(data.counters.custom || []).map(c => renderCounterItem(c, true))}
               </div>
            </div>
        </div>
    );
};
