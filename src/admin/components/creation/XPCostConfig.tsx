import React from 'react';
import { Coins, Zap, Sparkles } from 'lucide-react';
import { MotionCard } from '../../../components/ui/motion/MotionCard';
import { RulesXPCosts } from '../../../types/rules';

interface XPCostConfigProps {
    backgroundCost: number;
    xpCosts: RulesXPCosts;
    onUpdateBackgroundCost: (value: number) => void;
    onUpdateXPCost: <K extends keyof RulesXPCosts>(field: K, value: RulesXPCosts[K]) => void;
}

export const XPCostConfig: React.FC<XPCostConfigProps> = ({
    backgroundCost,
    xpCosts,
    onUpdateBackgroundCost,
    onUpdateXPCost
}) => {
    return (
        <MotionCard className="p-6 border border-amber-900/20 bg-amber-950/5 group" hoverEffect="glow">
            <h4 className="text-xs font-black text-amber-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <Coins size={14} /> Facteurs de Coût (XP)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* background cost */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-900/10 text-amber-500 rounded-sm border border-amber-900/20">
                            <Coins size={18} />
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black text-stone-300 uppercase tracking-wider">Arrière-Plans</h5>
                            <p className="text-[9px] text-stone-500 font-bold italic">Base XP</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-stone-950/60 p-2 rounded-sm border border-stone-800 focus-within:border-amber-500/30 transition-colors">
                        <input
                            type="number"
                            value={backgroundCost ?? 2}
                            onChange={(e) => onUpdateBackgroundCost(parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-none text-right font-mono font-black text-amber-500 focus:outline-none text-lg"
                        />
                        <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter shrink-0 pr-1 border-l border-stone-800 pl-2">XP</span>
                    </div>
                </div>

                {/* attributes cost */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-crimson-blood/10 text-rose-500 rounded-sm border border-rose-900/20">
                            <Zap size={18} />
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black text-stone-300 uppercase tracking-wider">Attributs</h5>
                            <p className="text-[9px] text-stone-500 font-bold italic">Par rang</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-stone-950/60 p-2 rounded-sm border border-stone-800 focus-within:border-amber-500/30 transition-colors">
                        <input
                            type="number"
                            value={xpCosts.attributeFactor ?? 6}
                            onChange={(e) => onUpdateXPCost('attributeFactor', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-none text-right font-mono font-black text-amber-500 focus:outline-none text-lg"
                        />
                        <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter shrink-0 pr-1 border-l border-stone-800 pl-2">XP</span>
                    </div>
                </div>

                {/* traits cost */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-900/10 text-emerald-500 rounded-sm border border-emerald-900/20">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black text-stone-300 uppercase tracking-wider">Traits</h5>
                            <p className="text-[9px] text-stone-500 font-bold italic">Par point</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-stone-950/60 p-2 rounded-sm border border-stone-800 focus-within:border-amber-500/30 transition-colors">
                        <input
                            type="number"
                            value={xpCosts.traitCost ?? 5}
                            onChange={(e) => onUpdateXPCost('traitCost', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-none text-right font-mono font-black text-amber-500 focus:outline-none text-lg"
                        />
                        <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter shrink-0 pr-1 border-l border-stone-800 pl-2">XP</span>
                    </div>
                </div>
            </div>
        </MotionCard>
    );
};
