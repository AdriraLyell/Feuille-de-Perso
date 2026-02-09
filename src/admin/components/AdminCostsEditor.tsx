import React from 'react';
import { RulesData } from '../../types/rules';
import { Coins, AlertTriangle, Calculator, TrendingUp, Sigma, Zap, BarChart3, Info } from 'lucide-react';
import { RuleCalculationsService } from '../../services/RuleCalculationsService';

interface AdminCostsEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminCostsEditor: React.FC<AdminCostsEditorProps> = ({ rules, onUpdate }) => {
    const costs = rules.configurations.xpCosts;
    const creationConfig = rules.configurations.creation;

    // Calculs de preview
    const exampleRank = 3;
    const exampleTriangular = RuleCalculationsService.triangular(exampleRank);

    const updateFactor = (field: string, value: number) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                xpCosts: {
                    ...rules.configurations.xpCosts,
                    [field]: value
                }
            }
        });
    };

    const updateCreationCost = (field: string, value: number) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                creation: {
                    ...rules.configurations.creation,
                    [field]: value
                }
            }
        });
    };

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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">

            {/* MAIN SECTION: SKILL CATEGORY ECONOMY */}
            <div className="bg-white p-8 rounded shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 border-b pb-2 px-2">
                    <Coins size={20} className="text-amber-500" /> Économie des Compétences
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 italic text-slate-400 text-[10px] uppercase tracking-widest">
                                <th className="pb-3 px-2 font-bold">Catégorie</th>
                                <th className="pb-3 px-2 font-bold">Behavior</th>
                                <th className="pb-3 px-4 font-bold text-center">Formule</th>
                                <th className="pb-3 px-2 font-bold text-right w-32">Multiplicateur</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rules.definitions.skillCategories.map(cat => (
                                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-4 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <Zap size={14} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-700">{cat.label}</div>
                                                <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{cat.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.behavior === 'Compétence' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            cat.behavior === 'Arrière-plan' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                cat.behavior === 'Secondaire' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            {cat.behavior}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="inline-flex bg-slate-100 p-1 rounded-sm gap-1">
                                                <button
                                                    onClick={() => updateCategoryCost(cat.id, cat.costConfig.factor, 'triangular')}
                                                    className={`px-3 py-1 rounded-sm text-[10px] font-bold transition-all flex items-center gap-1 ${cat.costConfig.type === 'triangular'
                                                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                                                        : 'text-slate-400 hover:text-slate-600'
                                                        }`}
                                                    title="Somme triangulaire (1+2+3...)"
                                                >
                                                    <BarChart3 size={12} /> Triangulaire
                                                </button>
                                                <button
                                                    onClick={() => updateCategoryCost(cat.id, cat.costConfig.factor, 'linear')}
                                                    className={`px-3 py-1 rounded-sm text-[10px] font-bold transition-all flex items-center gap-1 ${cat.costConfig.type === 'linear'
                                                        ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                                                        : 'text-slate-400 hover:text-slate-600'
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
                                            <span className="text-xs text-slate-300 font-bold">x</span>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={cat.costConfig.factor}
                                                onChange={(e) => updateCategoryCost(cat.id, parseFloat(e.target.value) || 0, cat.costConfig.type)}
                                                className="w-16 p-2 border border-slate-200 rounded text-center font-bold text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 bg-slate-50 p-4 rounded border border-dashed border-slate-200 text-xs text-slate-500 italic flex gap-3 items-center">
                    <Info size={16} className="text-slate-400 shrink-0" />
                    Le coût total d'un élément est calculé ainsi : [Valeur de Base] × [Multiplicateur].
                    Par exemple, Rang 3 en Triangulaire (1+2+3=6) avec un multiplicateur de x3 coûte 18 XP.
                </div>
            </div>

        </div>
    );
};

export default AdminCostsEditor;
