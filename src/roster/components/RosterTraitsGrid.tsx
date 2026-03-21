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
    const [activeCategory, setActiveCategory] = useState<'advantages' | 'disadvantages'>('advantages');

    return (
        <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-stone-950 border-b border-stone-800">
                <button
                    onClick={() => setShowTraits(!showTraits)}
                    className="flex-grow p-4 flex justify-between items-center hover:bg-stone-900 transition-colors"
                >
                    <h2 className="font-serif font-bold text-lg text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        Profils & Traits
                    </h2>
                    <div className="flex items-center gap-4">
                        {showTraits ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} className="text-amber-600" />}
                    </div>
                </button>

                {showTraits && (
                    <div className="flex items-center flex-wrap gap-4 px-4 pb-4 sm:pb-0 border-t sm:border-t-0 sm:border-l border-stone-800 h-auto sm:h-10 py-2 sm:py-0">
                        {/* Tab Switcher */}
                        <div className="flex bg-stone-950 p-1 rounded-sm border border-stone-800 shadow-inner overflow-hidden">
                            <button
                                onClick={() => setActiveCategory('advantages')}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                                    activeCategory === 'advantages' 
                                    ? 'text-emerald-400 bg-emerald-950/40' 
                                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'
                                }`}
                            >
                                Avantages
                                {activeCategory === 'advantages' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveCategory('disadvantages')}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                                    activeCategory === 'disadvantages' 
                                    ? 'text-rose-400 bg-rose-950/40' 
                                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'
                                }`}
                            >
                                Désavantages
                                {activeCategory === 'disadvantages' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 border-l border-stone-800/50 pl-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 hidden xl:block">Trier :</span>
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

                            const currentTraits = activeCategory === 'advantages' 
                                ? getSortedTraits(data.page2?.avantages || [])
                                : getSortedTraits(data.page2?.desavantages || []);

                            const isAdv = activeCategory === 'advantages';

                            return (
                                <MotionFade key={char.id} delay={0.1 * index}>
                                    <div className="h-full bg-stone-900/30 border border-stone-800 rounded-sm p-5 flex flex-col hover:border-amber-900/50 transition-colors shadow-glass-dark">
                                        <h3 className="font-serif font-bold text-xl text-amber-400 mb-1 border-b border-stone-800 pb-2 truncate">
                                            {char.character_name}
                                        </h3>

                                        <div className="mt-4 flex-grow">
                                            <div className="flex flex-col w-full h-full">
                                                {currentTraits.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {currentTraits.map((trait, i) => (
                                                            <div 
                                                                key={i} 
                                                                className={`text-[11px] leading-tight px-2.5 py-1.5 rounded-sm border flex justify-between items-start gap-2 w-full transition-colors bg-stone-900/40 text-stone-300 border-stone-800 border-l-2 ${
                                                                    isAdv 
                                                                    ? 'border-l-emerald-500 hover:bg-stone-800/50' 
                                                                    : 'border-l-rose-500 hover:bg-stone-800/50'
                                                                }`}
                                                            >
                                                                <span className="font-bold break-words whitespace-normal text-left flex-1" title={trait.variant ? `${trait.name} : ${trait.variant}` : trait.name}>
                                                                    {trait.name}
                                                                    {trait.variant && (
                                                                        <span className="opacity-50 font-normal italic ml-1">
                                                                            : {trait.variant}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                {trait.value && (
                                                                    <span className={`font-mono text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-sm border ${
                                                                        isAdv
                                                                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                                                                        : 'bg-rose-950/60 text-rose-400 border-rose-900/50'
                                                                    }`}>
                                                                        {trait.value}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-stone-600 italic text-center py-4">
                                                        Aucun {isAdv ? 'avantage' : 'désavantage'}
                                                    </div>
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
