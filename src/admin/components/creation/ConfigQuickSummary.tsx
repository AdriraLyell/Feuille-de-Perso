import React from 'react';
import { Settings, Activity, Coins, Zap } from 'lucide-react';
import { MotionFade } from '../../../components/ui/motion/MotionFade';
import { MotionCard } from '../../../components/ui/motion/MotionCard';
import { RulesCreationConfig, RulesXPCosts } from '../../../types/rules';

interface ConfigQuickSummaryProps {
    version: string;
    onUpdateVersion: (v: string) => void;
    config: RulesCreationConfig;
    xpCosts: RulesXPCosts;
    updateCreationConfig: (field: keyof RulesCreationConfig, value: any) => void;
    updateXPCost: (field: keyof RulesXPCosts, value: any) => void;
}

export const ConfigQuickSummary: React.FC<ConfigQuickSummaryProps> = ({
    version,
    onUpdateVersion,
    config,
    xpCosts,
    updateCreationConfig,
    updateXPCost
}) => {
    return (
        <div className="space-y-6">
            <MotionFade delay={0.15}>
                <MotionCard
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-stone-900/60 border-l-4 border-amber-600 shadow-glass"
                    hoverEffect="glow"
                >
                    <div className="flex items-start gap-5">
                        <div className="p-4 bg-amber-900/20 text-amber-500 rounded-sm border border-amber-900/30 shadow-inner">
                            <Settings size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-black text-amber-500 uppercase tracking-widest leading-none">Configuration du Système</h3>
                            <p className="text-xs text-stone-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                Réglages fondamentaux de la mécanique de jeu
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end bg-stone-950/40 p-4 rounded-sm border border-stone-800">
                        <span className="text-[10px] font-black text-stone-600 uppercase tracking-[0.3em] mb-2 px-1">Version du Corpus</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-stone-500 font-mono">v</span>
                            <input
                                type="text"
                                value={version}
                                onChange={(e) => onUpdateVersion(e.target.value)}
                                className="w-24 bg-stone-900 border border-stone-700 rounded-sm px-3 py-1 text-center font-mono font-black text-amber-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all outline-none text-sm"
                                placeholder="1.0.0"
                            />
                        </div>
                    </div>
                </MotionCard>
            </MotionFade>

            {/* Quick Toggle Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <MotionFade delay={0.2}>
                    <MotionCard className="p-6 h-full flex flex-col justify-between border border-stone-800/50 group" hoverEffect="glow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-void-indigo/10 text-indigo-400 rounded-sm border border-indigo-900/20 group-hover:scale-110 transition-transform">
                                <Activity size={24} />
                            </div>
                            <button
                                onClick={() => updateCreationConfig('extendedSkills', !config.extendedSkills)}
                                className={`w-12 h-6 rounded-full p-1 transition-all relative border ${config.extendedSkills ? 'bg-indigo-600 border-indigo-400 shadow-glow-indigo' : 'bg-stone-800 border-stone-700'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.extendedSkills ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-stone-200 uppercase tracking-widest mb-1">Rangs Étendus</h4>
                            <p className="text-[10px] text-stone-500 font-bold italic leading-relaxed">Permet aux compétences de dépasser le rang 5 (ex: Maîtrise Légendaire).</p>
                        </div>
                    </MotionCard>
                </MotionFade>

                <MotionFade delay={0.25}>
                    <MotionCard className="p-6 h-full flex flex-col justify-between border border-stone-800/50 group" hoverEffect="glow">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-amber-900/10 text-amber-500 rounded-sm border border-amber-900/20 group-hover:scale-110 transition-transform">
                                <Coins size={24} />
                            </div>
                            <div className="flex-grow">
                                <h4 className="text-sm font-black text-stone-200 uppercase tracking-widest">Coût Arrière-Plans</h4>
                                <p className="text-[10px] text-stone-500 font-bold italic">Base de calcul XP</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-stone-950/40 p-2 rounded-sm border border-stone-800">
                            <input
                                type="number"
                                value={config.backgroundCost ?? 2}
                                onChange={(e) => updateCreationConfig('backgroundCost', parseInt(e.target.value) || 0)}
                                className="w-full bg-transparent border-none text-right font-mono font-black text-amber-500 focus:outline-none text-lg"
                            />
                            <span className="text-[10px] font-black text-stone-600 uppercase tracking-tighter shrink-0 pr-2 border-l border-stone-800 pl-3">Points XP</span>
                        </div>
                    </MotionCard>
                </MotionFade>

                <MotionFade delay={0.3}>
                    <MotionCard className="p-6 h-full flex flex-col justify-between border border-stone-800/50 group" hoverEffect="glow">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-crimson-blood/10 text-rose-500 rounded-sm border border-rose-900/20 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <div className="flex-grow">
                                <h4 className="text-sm font-black text-stone-200 uppercase tracking-widest">Coût Attributs</h4>
                                <p className="text-[10px] text-stone-500 font-bold italic">Prix par échelon</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-stone-950/40 p-2 rounded-sm border border-stone-800">
                            <input
                                type="number"
                                value={xpCosts.attributeFactor ?? 6}
                                onChange={(e) => updateXPCost('attributeFactor', parseInt(e.target.value) || 0)}
                                className="w-full bg-transparent border-none text-right font-mono font-black text-amber-500 focus:outline-none text-lg"
                            />
                            <span className="text-[10px] font-black text-stone-600 uppercase tracking-tighter shrink-0 pr-2 border-l border-stone-800 pl-3">Points XP</span>
                        </div>
                    </MotionCard>
                </MotionFade>
            </div>
        </div>
    );
};
