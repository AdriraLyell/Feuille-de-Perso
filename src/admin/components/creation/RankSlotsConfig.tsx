import React from 'react';
import { List, Layers } from 'lucide-react';
import { MotionCard } from '../../../components/ui/motion/MotionCard';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface RankSlotsConfigProps {
    rankSlots: { [key: number]: number };
    onUpdateRankSlot: (rank: number, value: number) => void;
}

const RankSlotsConfig: React.FC<RankSlotsConfigProps> = ({ rankSlots, onUpdateRankSlot }) => {
    return (
        <MotionCard className="p-8 h-full" hoverEffect="glow">
            <h4 className="font-serif font-black text-amber-500 border-b border-stone-800 pb-4 mb-8 flex items-center gap-3 uppercase tracking-[0.2em] text-lg">
                <List size={20} className="text-amber-600" /> Répartition des Rangs
            </h4>

            <div className="bg-amber-950/10 border border-amber-900/20 p-4 rounded-sm mb-6 flex items-start gap-3">
                <Layers size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-relaxed">
                    Définissez combien de compétences un joueur peut avoir à chaque rang lors de la création initiale.
                </p>
            </div>

            <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rank, index) => (
                    <MotionFade key={rank} delay={index * 0.05} className="w-full">
                        <div className="flex items-center justify-between p-4 bg-stone-950/40 border border-stone-800 rounded-sm hover:bg-stone-900/40 hover:border-amber-900/30 transition-all group overflow-hidden relative">
                            {/* Decorative Rank Number */}
                            <span className="absolute -left-1 -bottom-2 text-6xl font-serif font-black text-stone-900 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">{rank}</span>

                            <div className="flex flex-col z-10">
                                <span className="font-black text-stone-400 group-hover:text-amber-500 transition-colors text-xs uppercase tracking-[0.2em]">Rang {rank}</span>
                            </div>

                            <div className="flex items-center gap-4 z-10">
                                <div className="flex flex-col items-end">
                                    <input
                                        type="number"
                                        value={rankSlots[rank] || 0}
                                        onChange={(e) => onUpdateRankSlot(rank, parseInt(e.target.value) || 0)}
                                        className="w-24 bg-stone-900 border border-stone-700 rounded-sm px-4 py-2 text-center font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none text-amber-500 font-black text-xl tabular-nums shadow-inner"
                                    />
                                    <span className="text-[8px] font-black text-stone-700 uppercase tracking-tighter mt-1 mr-1">Rangs Disponibles</span>
                                </div>
                            </div>
                        </div>
                    </MotionFade>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-stone-800 text-center">
                <p className="text-[10px] text-stone-600 italic font-medium uppercase tracking-[0.1em]">
                    Ces réglages ne s'appliquent qu'au mode de création "Par Rangs".
                </p>
            </div>
        </MotionCard>
    );
};

export default RankSlotsConfig;
