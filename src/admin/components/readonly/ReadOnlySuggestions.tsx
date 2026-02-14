import React from 'react';
import { Sparkles, Clock, Info } from 'lucide-react';
import { CharacterSheetData } from '../../../types/character';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface ReadOnlySuggestionsProps {
    suggestions?: CharacterSheetData['suggestions'];
    getCategoryLabel: (id: string) => string;
}

export const ReadOnlySuggestions: React.FC<ReadOnlySuggestionsProps> = ({ suggestions, getCategoryLabel }) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <MotionFade delay={0.15}>
            <section className="bg-amber-950/20 border border-amber-500/30 p-6 rounded-sm shadow-glow-gold/10 animate-pulse-subtle">
                <h3 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-amber-900/30 pb-2">
                    <Sparkles size={16} /> Écritures Suspectes
                </h3>
                <div className="space-y-3">
                    {suggestions.map((suggestion, idx) => (
                        <div key={idx} className="bg-stone-950/40 p-4 rounded-sm border border-amber-900/20 flex justify-between items-center group shadow-sm">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm tracking-tighter shadow-sm ${suggestion.type === 'background' ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 text-amber-500 border border-amber-900/30'}`}>
                                        {suggestion.type === 'background' ? 'Historique' : 'Compétence'}
                                    </span>
                                    <span className="font-serif font-bold text-lg text-stone-200 group-hover:text-amber-400 transition-colors uppercase tracking-wide">{suggestion.name}</span>
                                </div>
                                <span className="text-[10px] text-stone-600 font-bold uppercase tracking-widest mt-2 ml-1">
                                    Mentionné dans : <span className="text-stone-400">{getCategoryLabel(suggestion.category)}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-stone-600 text-[10px] font-mono border-l border-stone-800 pl-4 h-8">
                                <Clock size={12} />
                                {new Date(suggestion.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                    <p className="text-[10px] text-amber-700 font-bold uppercase italic mt-4 flex items-center gap-2 px-1">
                        <Info size={12} className="shrink-0" />
                        Ces éléments modifiés par le joueur attendent votre approbation pour rejoindre votre bibliothèque.
                    </p>
                </div>
            </section>
        </MotionFade>
    );
};
