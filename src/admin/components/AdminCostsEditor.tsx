import React from 'react';
import { RulesData } from '../../types/rules';
import { Coins, Zap, BarChart3, TrendingUp, Info } from 'lucide-react';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { MotionCard } from '../../components/ui/motion/MotionCard';

interface AdminCostsEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminCostsEditor: React.FC<AdminCostsEditorProps> = ({ rules, onUpdate }) => {
    // const costs = rules.configurations.xpCosts;
    // const creationConfig = rules.configurations.creation;

    // Calculs de preview
    // const exampleRank = 3;
    // const exampleTriangular = RuleCalculationsService.triangular(exampleRank);

    const updateCategoryCost = (id: string, factor: number, type: 'linear' | 'triangular') => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                skillCategories: rules.definitions.skillCategories.map(cat =>
                    cat.id === id ? { ...cat, costConfig: { factor, type } } : cat
                )
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <MotionFade delay={0.1}>
                <MotionCard className="p-8" hoverEffect="glow">
                    <h3 className="font-bold text-stone-300 text-lg mb-6 flex items-center gap-2 border-b border-stone-700/50 pb-2 px-2 font-serif tracking-wide">
                        <Coins size={20} className="text-amber-500" /> Économie des Compétences
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-stone-800 italic text-stone-500 text-[10px] uppercase tracking-widest">
                                    <th className="pb-3 px-2 font-bold">Catégorie</th>
                                    <th className="pb-3 px-2 font-bold">Behavior</th>
                                    <th className="pb-3 px-4 font-bold text-center">Formule</th>
                                    <th className="pb-3 px-2 font-bold text-right w-32">Multiplicateur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800/30">
                                {rules.definitions.skillCategories.map((cat, index) => (
                                    <MotionFade key={cat.id} delay={0.2 + (index * 0.05)} usePresence={false} tag="tr" className="hover:bg-stone-800/30 transition-colors group">
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-sm bg-stone-950 flex items-center justify-center text-stone-600 group-hover:bg-amber-950/30 group-hover:text-amber-500 transition-colors border border-stone-800 group-hover:border-amber-500/30">
                                                    <Zap size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-stone-300 font-serif tracking-wide">{cat.label}</div>
                                                    <div className="text-[10px] text-stone-500 font-mono tracking-tighter uppercase">{cat.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${cat.behavior === 'Compétence' ? 'bg-emerald-950/30 text-emerald-500 border-emerald-900/50' :
                                                cat.behavior === 'Arrière-plan' ? 'bg-amber-950/30 text-amber-500 border-amber-900/50' :
                                                    cat.behavior === 'Secondaire' ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/50' :
                                                        'bg-stone-800 text-stone-400 border-stone-700'
                                                }`}>
                                                {cat.behavior}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <div className="inline-flex bg-stone-950 p-1 rounded-sm gap-1 border border-stone-800">
                                                    <button
                                                        onClick={() => updateCategoryCost(cat.id, cat.costConfig.factor, 'triangular')}
                                                        className={`px-3 py-1 rounded-sm text-[10px] font-bold transition-all flex items-center gap-1 ${cat.costConfig.type === 'triangular'
                                                            ? 'bg-stone-800 text-amber-500 shadow-sm ring-1 ring-amber-500/50'
                                                            : 'text-stone-600 hover:text-stone-400'
                                                            }`}
                                                        title="Somme triangulaire (1+2+3...)"
                                                    >
                                                        <BarChart3 size={12} /> Triangulaire
                                                    </button>
                                                    <button
                                                        onClick={() => updateCategoryCost(cat.id, cat.costConfig.factor, 'linear')}
                                                        className={`px-3 py-1 rounded-sm text-[10px] font-bold transition-all flex items-center gap-1 ${cat.costConfig.type === 'linear'
                                                            ? 'bg-stone-800 text-emerald-500 shadow-sm ring-1 ring-emerald-500/50'
                                                            : 'text-stone-600 hover:text-stone-400'
                                                            }`}
                                                        title="Progression par palier fixe"
                                                    >
                                                        <TrendingUp size={12} /> Linéaire
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs text-stone-600 font-bold">x</span>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={cat.costConfig.factor}
                                                    onChange={(e) => updateCategoryCost(cat.id, parseFloat(e.target.value) || 0, cat.costConfig.type)}
                                                    className="w-16 p-2 border border-stone-700 rounded-sm text-center font-bold text-sm bg-stone-950 text-stone-300 focus:bg-stone-900 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all placeholder-stone-700"
                                                />
                                            </div>
                                        </td>
                                    </MotionFade>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 bg-stone-950/50 p-4 rounded-sm border border-dashed border-stone-800 text-xs text-stone-500 italic flex gap-3 items-center">
                        <Info size={16} className="text-stone-600 shrink-0" />
                        <div>
                            Le coût total d'un élément est calculé ainsi : [Valeur de Base] × [Multiplicateur].
                            <br />
                            Par exemple, Rang 3 en Triangulaire (1+2+3=6) avec un multiplicateur de x3 coûte 18 XP.
                        </div>
                    </div>
                </MotionCard>
            </MotionFade>
        </div>
    );
};

export default AdminCostsEditor;
