import React from 'react';
import { Zap } from 'lucide-react';
import { CharacterSheetData } from '../../../types/character';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface ReadOnlyTraitsProps {
    avantages?: CharacterSheetData['page2']['avantages'];
    desavantages?: CharacterSheetData['page2']['desavantages'];
}

export const ReadOnlyTraits: React.FC<ReadOnlyTraitsProps> = ({ avantages = [], desavantages = [] }) => {
    const hasAvantages = avantages.filter(t => t.name && t.name.trim() !== '').length > 0;
    const hasDesavantages = desavantages.filter(t => t.name && t.name.trim() !== '').length > 0;

    if (!hasAvantages && !hasDesavantages) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hasAvantages && (
                <MotionFade delay={0.35}>
                    <section className="bg-stone-900/40 border-l-4 border-emerald-900/50 p-6 rounded-sm shadow-glass">
                        <h3 className="text-sm font-bold text-emerald-600 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                            <Zap size={16} /> Éclats de Fortune
                        </h3>
                        <div className="space-y-3">
                            {avantages
                                .filter(t => t.name && t.name.trim() !== '')
                                .map((trait, idx) => (
                                    <div key={idx} className="bg-stone-950/40 p-3 rounded-sm border border-stone-800 flex justify-between items-start gap-4 group hover:border-emerald-900/30 transition-all">
                                        <div className="flex flex-col">
                                            <div className="font-bold text-xs text-stone-300 group-hover:text-emerald-500 uppercase tracking-widest">{trait.name}</div>
                                            {trait.variant && <div className="text-[10px] text-stone-600 italic font-medium uppercase tracking-tighter mt-1">{trait.variant}</div>}
                                        </div>
                                        <span className="font-mono font-black text-emerald-500 bg-emerald-900/20 px-2 py-1 rounded-sm text-xs border border-emerald-900/30 shadow-inner">+{trait.value}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </section>
                </MotionFade>
            )}

            {hasDesavantages && (
                <MotionFade delay={0.35}>
                    <section className="bg-stone-900/40 border-l-4 border-red-900/50 p-6 rounded-sm shadow-glass">
                        <h3 className="text-sm font-bold text-red-600 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                            <Zap size={16} className="rotate-180" /> Fardeaux de l'Ombre
                        </h3>
                        <div className="space-y-3">
                            {desavantages
                                .filter(t => t.name && t.name.trim() !== '')
                                .map((trait, idx) => (
                                    <div key={idx} className="bg-stone-950/40 p-3 rounded-sm border border-stone-800 flex justify-between items-start gap-4 group hover:border-red-900/30 transition-all">
                                        <div className="flex flex-col">
                                            <div className="font-bold text-xs text-stone-300 group-hover:text-red-500 uppercase tracking-widest">{trait.name}</div>
                                            {trait.variant && <div className="text-[10px] text-stone-600 italic font-medium uppercase tracking-tighter mt-1">{trait.variant}</div>}
                                        </div>
                                        <span className="font-mono font-black text-red-500 bg-red-900/20 px-2 py-1 rounded-sm text-xs border border-red-900/30 shadow-inner">-{trait.value}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </section>
                </MotionFade>
            )}
        </div>
    );
};
