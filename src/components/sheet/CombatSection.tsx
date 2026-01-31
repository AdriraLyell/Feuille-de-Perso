
import React from 'react';
import { CharacterSheetData, CombatEntry } from '../../types';
import { SectionHeader } from './Shared';

interface CombatSectionProps {
    data: CharacterSheetData;
    updateCombatWeapon: (id: string, field: keyof CombatEntry, value: string) => void;
    updateArmor: (index: number, field: keyof CharacterSheetData['combat']['armor'][0], value: string) => void;
}

export const CombatSection: React.FC<CombatSectionProps> = ({ data, updateCombatWeapon, updateArmor }) => {
    return (
      <div className="flex flex-col border-t border-stone-800 md:border-t-0 bg-stone-50/50">
          <SectionHeader title="Combat" />
          <div className="flex items-center text-[9px] font-bold border-b border-stone-400 bg-stone-200 text-stone-700 uppercase py-1 text-center tracking-tight">
             <div className="w-[35%] text-left pl-2">Arme</div>
             <div className="w-[10%] border-l border-stone-300">Niv.</div>
             <div className="w-[12%] border-l border-stone-300">Init.</div>
             <div className="w-[12%] border-l border-stone-300">Atk.</div>
             <div className="w-[18%] border-l border-stone-300">Dmg.</div>
             <div className="w-[13%] border-l border-stone-300">Par.</div>
          </div>
          
          <div className="flex-grow">
              {(data.combat.weapons || []).map((w) => (
              <div key={w.id} className="flex items-center text-xs border-b border-dotted border-stone-300 h-[22px] last:border-0 hover:bg-stone-100 transition-colors">
                  <div className="w-[35%] px-1 h-full">
                       <input className="w-full h-full bg-transparent font-bold focus:outline-none placeholder-stone-300 font-handwriting text-ink text-sm" placeholder="Arme..." value={w.weapon} onChange={(e) => updateCombatWeapon(w.id, 'weapon', e.target.value)} />
                  </div>
                  <div className="w-[10%] h-full border-l border-dotted border-stone-300">
                       <input className="w-full h-full bg-transparent text-center text-stone-400 text-xs focus:outline-none font-handwriting text-ink" value={w.level} onChange={(e) => updateCombatWeapon(w.id, 'level', e.target.value)} />
                  </div>
                  <div className="w-[12%] h-full border-l border-dotted border-stone-300">
                       <input className="w-full h-full bg-transparent text-center focus:outline-none font-handwriting text-ink text-sm" value={w.init} onChange={(e) => updateCombatWeapon(w.id, 'init', e.target.value)} />
                  </div>
                  <div className="w-[12%] h-full border-l border-dotted border-stone-300">
                       <input className="w-full h-full bg-transparent text-center focus:outline-none font-handwriting text-ink text-sm" value={w.attack} onChange={(e) => updateCombatWeapon(w.id, 'attack', e.target.value)} />
                  </div>
                  <div className="w-[18%] h-full border-l border-dotted border-stone-300 relative flex items-center justify-center">
                       <input className="w-full h-full bg-transparent text-center focus:outline-none font-handwriting text-ink text-sm" value={w.damage} onChange={(e) => updateCombatWeapon(w.id, 'damage', e.target.value)} />
                  </div>
                  <div className="w-[13%] h-full border-l border-dotted border-stone-300">
                       <input className="w-full h-full bg-transparent text-center focus:outline-none font-handwriting text-ink text-sm" value={w.parry} onChange={(e) => updateCombatWeapon(w.id, 'parry', e.target.value)} />
                  </div>
              </div>
              ))}
          </div>
          
          <div className="border-t border-stone-400 bg-stone-100 p-1">
               {(data.combat.armor || []).map((armor, i) => (
                   <div key={i} className="flex items-center h-[22px] text-xs border-b border-stone-300 last:border-0 border-dotted">
                      <span className="font-bold text-[9px] uppercase w-12 text-stone-700">Armure</span>
                      <input 
                          className="flex-grow bg-transparent border-b border-stone-300 px-1 font-semibold text-sm focus:border-blue-500 outline-none font-handwriting text-ink"
                          value={armor.type}
                          onChange={(e) => updateArmor(i, 'type', e.target.value)}
                      />
                      <div className="flex items-center ml-2 border-l border-stone-300 pl-2">
                           <span className="font-bold text-[9px] uppercase text-stone-500 mr-1">Prot.</span>
                           <input 
                              className="w-8 bg-transparent border-b border-dotted border-stone-300 text-center focus:border-blue-500 outline-none font-handwriting text-ink text-sm"
                              value={armor.protection}
                              onChange={(e) => updateArmor(i, 'protection', e.target.value)}
                           />
                      </div>
                      <div className="flex items-center ml-2 border-l border-stone-300 pl-2">
                           <span className="font-bold text-[9px] uppercase text-stone-500 mr-1">Poids</span>
                           <input 
                              className="w-8 bg-transparent border-b border-dotted border-stone-300 text-center focus:border-blue-500 outline-none font-handwriting text-ink text-sm"
                              value={armor.weight}
                              onChange={(e) => updateArmor(i, 'weight', e.target.value)}
                           />
                      </div>
                   </div>
               ))}
          </div>
      </div>
    );
};
