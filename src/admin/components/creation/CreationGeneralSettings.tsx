import React from 'react';
import { Sliders, Target, Layout, CircleDot } from 'lucide-react';
import { RulesCreationConfig } from '../../../types/rules';
import { MotionFade } from '../../../components/ui/motion/MotionFade';
import { MotionCard } from '../../../components/ui/motion/MotionCard';

interface CreationGeneralSettingsProps {
    config: RulesCreationConfig;
    onUpdateConfig: <K extends keyof RulesCreationConfig>(field: K, value: RulesCreationConfig[K]) => void;
    onUpdatePointsBuckets: (bucket: 'attributes' | 'skills' | 'backgrounds', value: number) => void;
}

const CreationGeneralSettings: React.FC<CreationGeneralSettingsProps> = ({
    config,
    onUpdateConfig,
    onUpdatePointsBuckets
}) => {
    return (
        <MotionCard className="p-8 h-full" hoverEffect="glow">
            <h4 className="font-serif font-black text-amber-500 border-b border-stone-800 pb-4 mb-8 flex items-center gap-3 uppercase tracking-[0.2em] text-lg">
                <Sliders size={20} className="text-amber-600" /> Méthodes de Création
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-2 group">
                    <label htmlFor="attribute-min" className="block text-[10px] font-black text-stone-500 mb-2 uppercase tracking-[0.25em] ml-1 group-hover:text-amber-500/50 transition-colors">Seuil Minimal d'Attribut</label>
                    <div className="relative">
                        <input
                            id="attribute-min"
                            type="number"
                            value={config.attributeMin ?? -1}
                            onChange={(e) => onUpdateConfig('attributeMin', parseInt(e.target.value))}
                            className="w-full bg-stone-950 border border-stone-800 rounded-sm px-4 py-3 text-sm text-stone-300 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all outline-none font-mono"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-700 pointer-events-none">
                            <Target size={16} />
                        </div>
                    </div>
                </div>
                <div className="space-y-2 group">
                    <label htmlFor="attribute-max" className="block text-[10px] font-black text-stone-500 mb-2 uppercase tracking-[0.25em] ml-1 group-hover:text-amber-500/50 transition-colors">Plafond Maximal d'Attribut</label>
                    <div className="relative">
                        <input
                            id="attribute-max"
                            type="number"
                            value={config.attributeMax ?? 3}
                            onChange={(e) => onUpdateConfig('attributeMax', parseInt(e.target.value))}
                            className="w-full bg-stone-950 border border-stone-800 rounded-sm px-4 py-3 text-sm text-stone-300 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all outline-none font-mono"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-700 pointer-events-none">
                            <Target size={16} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div>
                    <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Layout size={14} className="text-amber-700" /> Philosophie de Création
                    </label>
                    <div className="grid grid-cols-2 bg-stone-950 p-1.5 rounded-sm gap-2 border border-stone-800">
                        <button
                            onClick={() => onUpdateConfig('mode', 'rangs')}
                            className={`py-3 text-[10px] font-black uppercase tracking-[0.15em] rounded-sm transition-all duration-300 ${config.mode === 'rangs' ? 'bg-amber-600 text-stone-950 shadow-glow-gold' : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900'}`}
                        >
                            Par Rangs (Classique)
                        </button>
                        <button
                            onClick={() => onUpdateConfig('mode', 'points')}
                            className={`py-3 text-[10px] font-black uppercase tracking-[0.15em] rounded-sm transition-all duration-300 ${config.mode === 'points' ? 'bg-amber-600 text-stone-950 shadow-glow-gold' : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900'}`}
                        >
                            Par Points (Moderne)
                        </button>
                    </div>
                    <p className="text-[10px] text-stone-600 italic mt-3 px-1 leading-relaxed">
                        {config.mode === 'rangs'
                            ? "Le joueur choisit des blocs de niveaux (ex: 2 rangs à 3, 4 rangs à 2)."
                            : "Le joueur dispose d'un capital d'XP pour acheter ses scores librement."}
                    </p>
                </div>

                {config.mode === 'points' && (
                    <MotionFade className="space-y-6 pt-4 border-t border-stone-800/50">
                        <div>
                            <label className="block text-xs font-black text-stone-400 mb-4 uppercase tracking-widest">Type de Répartition</label>
                            <div className="grid grid-cols-2 bg-stone-950 p-1.5 rounded-sm gap-2 border border-stone-800 shadow-inner">
                                <button
                                    onClick={() => onUpdateConfig('pointsDistributionMode', 'global')}
                                    className={`py-2.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${(!config.pointsDistributionMode || config.pointsDistributionMode === 'global') ? 'bg-stone-800 text-amber-500 border border-amber-900/30 shadow-sm' : 'text-stone-600 hover:text-stone-400'}`}
                                >
                                    Trésor Unique
                                </button>
                                <button
                                    onClick={() => onUpdateConfig('pointsDistributionMode', 'buckets')}
                                    className={`py-2.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${config.pointsDistributionMode === 'buckets' ? 'bg-stone-800 text-amber-500 border border-amber-900/30 shadow-sm' : 'text-stone-600 hover:text-stone-400'}`}
                                >
                                    Bourses Dédiées
                                </button>
                            </div>
                        </div>

                        {(!config.pointsDistributionMode || config.pointsDistributionMode === 'global') ? (
                            <MotionFade key="global-xp" className="bg-stone-950/50 p-6 rounded-sm border border-stone-800 shadow-inner group">
                                <label htmlFor="starting-xp" className="block text-[10px] font-black text-stone-500 mb-3 uppercase tracking-[0.2em] group-hover:text-amber-500 transition-colors">Capital d'XP Initial</label>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-900/20 text-amber-500 rounded-sm">
                                        <CircleDot size={20} className="animate-pulse" />
                                    </div>
                                    <input
                                        id="starting-xp"
                                        type="number"
                                        value={config.startingXP || 0}
                                        onChange={(e) => onUpdateConfig('startingXP', parseInt(e.target.value) || 0)}
                                        className="w-full bg-transparent border-none focus:outline-none font-serif font-black text-4xl text-amber-500 tabular-nums"
                                    />
                                    <span className="text-xs font-black text-stone-700 uppercase tracking-widest">Points</span>
                                </div>
                            </MotionFade>
                        ) : (
                            <MotionFade key="buckets-xp" className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'attributes' as const, label: 'Bourse Attributs' },
                                    { id: 'skills' as const, label: 'Bourse Compétences' },
                                    { id: 'backgrounds' as const, label: 'Bourse Arrière-plans' }
                                ].map((bucket) => (
                                    <div key={bucket.id} className="bg-stone-950/40 p-4 rounded-sm border border-stone-800 flex justify-between items-center group hover:bg-stone-900/40 transition-all">
                                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest group-hover:text-amber-600 transition-colors">{bucket.label}</label>
                                        <input
                                            type="number"
                                            value={config.pointsBuckets?.[bucket.id] || 0}
                                            onChange={(e) => onUpdatePointsBuckets(bucket.id, parseInt(e.target.value) || 0)}
                                            className="w-24 bg-stone-900 border border-stone-800 rounded-sm px-3 py-1.5 focus:border-amber-500/50 outline-none text-amber-500 font-mono font-bold text-center"
                                        />
                                    </div>
                                ))}
                            </MotionFade>
                        )}
                    </MotionFade>
                )}

                {config.mode === 'rangs' && (
                    <MotionFade className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-800/50">
                        <div className="bg-stone-950/40 p-4 rounded-sm border border-stone-800 group hover:border-amber-900/20 transition-colors">
                            <label className="block text-[10px] font-black text-stone-500 mb-2 uppercase tracking-widest group-hover:text-amber-500/50 transition-colors">Capital Attributs</label>
                            <input
                                type="number"
                                value={config.attributePoints || 0}
                                onChange={(e) => onUpdateConfig('attributePoints', parseInt(e.target.value) || 0)}
                                className="w-full bg-transparent border-none focus:outline-none text-amber-500 font-serif font-black text-2xl"
                            />
                        </div>
                        <div className="bg-stone-950/40 p-4 rounded-sm border border-stone-800 group hover:border-amber-900/20 transition-colors">
                            <label className="block text-[10px] font-black text-stone-500 mb-2 uppercase tracking-widest group-hover:text-amber-500/50 transition-colors">Capital Arr. Plans</label>
                            <input
                                type="number"
                                value={config.backgroundPoints || 0}
                                onChange={(e) => onUpdateConfig('backgroundPoints', parseInt(e.target.value) || 0)}
                                className="w-full bg-transparent border-none focus:outline-none text-stone-300 font-serif font-black text-2xl"
                            />
                        </div>
                    </MotionFade>
                )}
            </div>
        </MotionCard>
    );
};

export default CreationGeneralSettings;
