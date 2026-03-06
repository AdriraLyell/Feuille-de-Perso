import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowDownAZ, ArrowUpAZ, Coins } from 'lucide-react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { CharacterSheetData } from '../../types';
import { MotionFade } from '../../components/ui/motion/MotionFade';

interface RosterTraitsGridProps {
    characters: SyncedCharacter[];
}

export const RosterTraitsGrid: React.FC<RosterTraitsGridProps> = ({
    characters
}) => {
    const [showTraits, setShowTraits] = useState(true);
    const [traitSortBy, setTraitSortBy] = useState<'name' | 'cost'>('name');
    const [traitSortOrder, setTraitSortOrder] = useState<'asc' | 'desc'>('asc');

    return (
        <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark">
            <div className="flex justify-between items-center bg-stone-950 border-b border-stone-800 pr-4">
                <button
                    onClick={() => setShowTraits(!showTraits)}
                    className="flex-grow p-4 flex justify-between items-center hover:bg-stone-900 transition-colors"
                >
                    <h2 className="font-serif font-bold text-lg text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        Profils & Traits
                    </h2>
                    {showTraits ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} className="text-amber-600" />}
                </button>

                {showTraits && (
                    <div className="flex items-center gap-4 border-l border-stone-800 pl-4 h-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 hidden sm:block">Trier :</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (traitSortBy === 'name') setTraitSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                    else { setTraitSortBy('name'); setTraitSortOrder('asc'); }
                                }}
                                className={`p-1.5 rounded-sm border transition-all flex items-center gap-1.5 ${traitSortBy === 'name' ? 'bg-amber-900/30 border-amber-600 text-amber-400' : 'bg-stone-900 border-stone-700 text-stone-500 hover:text-stone-300'}`}
                                title="Trier par nom"
                            >
                                {traitSortBy === 'name' ? (traitSortOrder === 'asc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />) : <ArrowDownAZ size={14} className="opacity-40" />}
                                <span className="text-[10px] font-bold uppercase tracking-tight hidden md:block">Nom</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (traitSortBy === 'cost') setTraitSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                    else { setTraitSortBy('cost'); setTraitSortOrder('asc'); }
                                }}
                                className={`p-1.5 rounded-sm border transition-all flex items-center gap-1.5 ${traitSortBy === 'cost' ? 'bg-amber-900/30 border-amber-600 text-amber-400' : 'bg-stone-900 border-stone-700 text-stone-500 hover:text-stone-300'}`}
                                title="Trier par coût"
                            >
                                <Coins size={14} className={traitSortBy === 'cost' ? 'text-amber-500' : 'opacity-40'} />
                                <span className="text-[10px] font-bold uppercase tracking-tight hidden md:block">Coût</span>
                                {traitSortBy === 'cost' && <span className="text-[10px] font-mono">{traitSortOrder === 'asc' ? '↑' : '↓'}</span>}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showTraits && (
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {characters.map((char, index) => {
                            const data = char.data as CharacterSheetData;

                            const getSortedTraits = (traits: import('../../types').TraitEntry[]) => {
                                const filtered = (traits || []).filter(t => t.name);
                                return [...filtered].sort((a, b) => {
                                    let comparison = 0;
                                    if (traitSortBy === 'name') {
                                        comparison = a.name.localeCompare(b.name);
                                    } else if (traitSortBy === 'cost') {
                                        const costA = parseInt(String(a.value)) || 0;
                                        const costB = parseInt(String(b.value)) || 0;
                                        comparison = costA - costB;
                                    }
                                    return traitSortOrder === 'asc' ? comparison : -comparison;
                                });
                            };

                            const sortedAdvs = getSortedTraits(data.page2?.avantages || []);
                            const sortedDesadvs = getSortedTraits(data.page2?.desavantages || []);

                            const hasTraitsAdvs = sortedAdvs.length > 0;
                            const hasTraitsDesadvs = sortedDesadvs.length > 0;

                            return (
                                <MotionFade key={char.id} delay={0.1 * index}>
                                    <div className="h-full bg-stone-900/30 border border-stone-800 rounded-sm p-5 flex flex-col hover:border-amber-900/50 transition-colors shadow-glass-dark">
                                        <h3 className="font-serif font-bold text-xl text-amber-400 mb-1 border-b border-stone-800 pb-2">
                                            {char.character_name}
                                        </h3>

                                        <div className="mt-4 grid grid-cols-2 gap-4 flex-grow items-start">
                                            <div className="flex flex-col w-full h-full">
                                                {hasTraitsAdvs && (
                                                    <>
                                                        <div className="text-[9px] uppercase tracking-widest text-amber-700/80 mb-2 font-black text-center border-b border-amber-900/30 pb-1">Avantages</div>
                                                        <div className="space-y-1">
                                                            {sortedAdvs.map((trait, i) => (
                                                                <div key={i} className="text-[11px] leading-tight px-2 py-1 rounded-sm border bg-emerald-950/20 text-emerald-400 border-emerald-900/20 truncate flex justify-between items-center w-full">
                                                                    <span className="font-bold truncate" title={trait.name}>{trait.name}</span>
                                                                    {trait.value && <span className="font-mono text-[10px] opacity-80 shrink-0 ml-1">{trait.value}</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex flex-col w-full h-full border-l border-stone-800/50 pl-4">
                                                {hasTraitsDesadvs && (
                                                    <>
                                                        <div className="text-[9px] uppercase tracking-widest text-amber-700/80 mb-2 font-black text-center border-b border-amber-900/30 pb-1">Désavantages</div>
                                                        <div className="space-y-1">
                                                            {sortedDesadvs.map((trait, i) => (
                                                                <div key={i} className="text-[11px] leading-tight px-2 py-1 rounded-sm border bg-rose-950/20 text-rose-400 border-rose-900/20 truncate flex justify-between items-center w-full">
                                                                    <span className="font-bold truncate" title={trait.name}>{trait.name}</span>
                                                                    {trait.value && <span className="font-mono text-[10px] opacity-80 shrink-0 ml-1">{trait.value}</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </MotionFade>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
