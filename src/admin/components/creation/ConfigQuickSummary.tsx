import React from 'react';
import { Settings, Activity, Coins, Zap, Sparkles } from 'lucide-react';
import { MotionFade } from '../../../components/ui/motion/MotionFade';
import { MotionCard } from '../../../components/ui/motion/MotionCard';
import { RulesCreationConfig, RulesXPCosts } from '../../../types/rules';

interface ConfigQuickSummaryProps {
    version: string;
    onUpdateVersion: (v: string) => void;
    config: RulesCreationConfig;
    xpCosts: RulesXPCosts;
    updateCreationConfig: <K extends keyof RulesCreationConfig>(field: K, value: RulesCreationConfig[K]) => void;
    updateXPCost: <K extends keyof RulesXPCosts>(field: K, value: RulesXPCosts[K]) => void;
}

export const ConfigQuickSummary: React.FC<ConfigQuickSummaryProps> = ({
    version,
    onUpdateVersion
}) => {
    return (
        <MotionFade delay={0.15}>
            <MotionCard
                className="flex items-center justify-between gap-6 px-6 py-3 bg-stone-900/60 border-l-4 border-amber-600 shadow-glass"
                hoverEffect="glow"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-900/20 text-amber-500 rounded-sm border border-amber-900/30">
                        <Settings size={18} />
                    </div>
                    <div className="flex items-center gap-4">
                        <h3 className="text-sm font-serif font-black text-amber-500 uppercase tracking-widest leading-none">Système</h3>
                        <div className="h-4 w-px bg-stone-800" />
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            Réglages de la mécanique de jeu
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-stone-950/40 px-3 py-1 rounded-sm border border-stone-800">
                    <span className="text-[9px] font-black text-stone-600 uppercase tracking-[0.2em]">Corpus</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-500 font-mono">v</span>
                        <input
                            type="text"
                            value={version}
                            onChange={(e) => onUpdateVersion(e.target.value)}
                            className="w-20 bg-stone-900 border border-stone-700 rounded-sm px-2 py-0.5 text-center font-mono font-black text-amber-500 focus:border-amber-500 outline-none text-xs"
                            placeholder="1.0.0"
                        />
                    </div>
                </div>
            </MotionCard>
        </MotionFade>
    );
};
