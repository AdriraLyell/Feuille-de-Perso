import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { CharacterSheetData } from '../../types';
import { getCategoryColor, getCategoryBgColor } from '../rosterUtils';

interface RosterAttributesTableProps {
    characters: SyncedCharacter[];
    allAttributes: { name: string, category: string }[];
}

export const RosterAttributesTable: React.FC<RosterAttributesTableProps> = ({
    characters,
    allAttributes
}) => {
    const [showAttributes, setShowAttributes] = useState(true);

    return (
        <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark mb-12">
            <button
                onClick={() => setShowAttributes(!showAttributes)}
                className="w-full p-4 flex justify-between items-center bg-stone-950 border-b border-stone-800 hover:bg-stone-900 transition-colors"
            >
                <h2 className="font-serif font-bold text-lg text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    Tableau Strict (Attributs)
                </h2>
                {showAttributes ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} className="text-amber-600" />}
            </button>

            {showAttributes && (
                <div className="overflow-x-auto bg-stone-900/20">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead className="bg-[#12100e] border-y border-stone-800/50">
                            <tr>
                                <th className="p-3 text-stone-500 font-bold uppercase tracking-widest text-[10px] sticky left-0 bg-[#12100e] z-30 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)] border-r border-stone-800/50">Identité</th>
                                {allAttributes.map((attr, idx) => {
                                    const isFirstInCategory = idx === 0 || attr.category !== allAttributes[idx - 1].category;
                                    return (
                                        <th
                                            key={attr.name}
                                            className={`p-3 font-bold uppercase tracking-widest text-[9px] text-center border-stone-800/20 ${isFirstInCategory && idx !== 0 ? 'border-l-4 border-stone-950' : 'border-l'}`}
                                            style={{
                                                color: getCategoryColor(attr.category),
                                                backgroundColor: getCategoryBgColor(attr.category)
                                            }}
                                        >
                                            {attr.name}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/50">
                            {characters.map(char => {
                                const data = char.data as CharacterSheetData;
                                const charAttrs: Record<string, number> = {};
                                Object.values(data.attributes || {}).forEach(cat => {
                                    cat.forEach(attr => { charAttrs[attr.name] = parseInt(attr.val1 || "0", 10); });
                                });

                                return (
                                    <tr key={char.id} className="hover:bg-amber-900/5 transition-colors">
                                        <td className="p-3 sticky left-0 bg-[#161412] z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)] border-r border-stone-800/50">
                                            <div className="font-serif font-bold text-lg text-amber-50" title={char.character_name}>
                                                {char.character_name.split(' ')[0]}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-stone-500">{char.player_name}</div>
                                            <div className="text-xs text-stone-400 italic mt-1 truncate max-w-[150px]">{data.header?.nature || ""}</div>
                                        </td>
                                        {allAttributes.map((attr, idx) => {
                                            const val = charAttrs[attr.name] || 0;
                                            const isExcep = val >= 3;
                                            const isNegative = val < 0;
                                            const isZero = val === 0;
                                            const isFirstInCategory = idx === 0 || attr.category !== allAttributes[idx - 1].category;

                                            return (
                                                <td
                                                    key={attr.name}
                                                    className={`p-3 text-center border-stone-800/10 ${isFirstInCategory && idx !== 0 ? 'border-l-4 border-stone-950' : 'border-l'}`}
                                                    style={{ backgroundColor: getCategoryBgColor(attr.category) }}
                                                >
                                                    <span className={`font-mono text-lg font-medium ${isZero ? 'opacity-30' : ''} ${isExcep ? 'text-amber-400 font-black scale-125 inline-block' : 'text-stone-300'} ${isNegative ? 'text-rose-500 font-bold' : ''}`}>
                                                        {val}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
