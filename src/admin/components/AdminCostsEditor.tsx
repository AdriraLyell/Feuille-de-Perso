import React from 'react';
import { RulesData } from '../../types/rules';
import { Coins, AlertTriangle, Calculator, TrendingUp } from 'lucide-react';
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

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">

            <div className="bg-white p-8 rounded shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 border-b pb-2 px-2">
                    <Coins size={20} className="text-amber-500" /> Gestion des Coûts (XP)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Progression Scale Logic */}
                    <div className="bg-slate-50 p-6 rounded border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calculator size={16} /> Formule de Progression
                        </h4>

                        <div className="bg-blue-50 border border-blue-100 p-3 rounded mb-6 text-xs text-blue-900 leading-relaxed">
                            <p className="font-bold mb-1">Règle Triangulaire :</p>
                            <p>Le coût est calculé selon le rang atteint :</p>
                            <ul className="list-disc ml-4 mt-1 space-y-0.5">
                                <li>Rang 1 = {RuleCalculationsService.triangular(1)} XP</li>
                                <li>Rang 2 = 1+2 = {RuleCalculationsService.triangular(2)} XP</li>
                                <li>Rang {exampleRank} = 1+2+3 = {exampleTriangular} XP</li>
                            </ul>
                            <p className="mt-2 text-blue-700">Le coût final est : <strong>Coût Base x Facteur</strong></p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-600">Facteur Compétence</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 font-bold">x</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={costs.skillFactor}
                                        onChange={(e) => updateFactor('skillFactor', parseFloat(e.target.value) || 0)}
                                        className="w-20 p-2 border border-slate-300 rounded text-center font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-600">Facteur Spécialisation</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 font-bold">x</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={costs.specializationFactor}
                                        onChange={(e) => updateFactor('specializationFactor', parseFloat(e.target.value) || 0)}
                                        className="w-20 p-2 border border-slate-300 rounded text-center font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Linear Costs */}
                    <div className="bg-slate-50 p-6 rounded border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp size={16} /> Progression Linéaire
                        </h4>
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded mb-6 text-xs text-emerald-900 leading-relaxed">
                            <p className="font-bold mb-1">Coût Fixe par Point :</p>
                            <p>Le coût est proportionnel à l'augmentation.</p>
                            <p className="mt-2 text-emerald-700">Coût = <strong>Différence x Coût Unitaire</strong></p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-600">Coût d'Attribut (par point)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="1"
                                        value={costs.attributeFactor ?? 6}
                                        onChange={(e) => updateFactor('attributeFactor', parseFloat(e.target.value) || 0)}
                                        className="w-20 p-2 border border-slate-300 rounded text-center font-bold"
                                    />
                                    <span className="text-xs text-slate-400 font-bold">XP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Creation Costs */}
                    <div className="bg-slate-50 p-6 rounded border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-widest">Création (Achat Fixe)</h4>
                        <div className="space-y-4">
                            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-xs text-amber-800 mb-4 flex gap-2">
                                <AlertTriangle size={16} />
                                Ces coûts concernent uniquement la création de personnage ("Mode Points").
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-600">Coût d'Attribut (1 point)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={creationConfig.attributeCost ?? 6}
                                        onChange={(e) => updateCreationCost('attributeCost', parseInt(e.target.value) || 0)}
                                        className="w-20 p-2 border border-slate-300 rounded text-center font-bold"
                                    />
                                    <span className="text-xs text-slate-400 font-bold w-6">XP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* LIMITS SECTION */}
            <div className="bg-white p-8 rounded shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 border-b pb-2 px-2">
                    <AlertTriangle size={20} className="text-red-500" /> Limites & Bornes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-widest">Globales</h4>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">Score Maximum Absolu</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={rules.configurations.global.maxAttributeScore}
                                    onChange={(e) => onUpdate({
                                        ...rules,
                                        configurations: {
                                            ...rules.configurations,
                                            global: {
                                                ...rules.configurations.global,
                                                maxAttributeScore: parseInt(e.target.value) || 5
                                            }
                                        }
                                    })}
                                    className="w-20 p-2 border border-slate-300 rounded text-center font-bold"
                                />
                                <span className="text-xs text-slate-400 font-bold w-6">pts</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-widest">À la Création</h4>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">Minimum par Attribut</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={creationConfig.attributeMin ?? 1}
                                    onChange={(e) => updateCreationCost('attributeMin', parseInt(e.target.value) || 0)}
                                    className="w-20 p-2 border border-slate-300 rounded text-center font-bold"
                                />
                                <span className="text-xs text-slate-400 font-bold w-6">pts</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">Maximum par Attribut</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={creationConfig.attributeMax ?? 5}
                                    onChange={(e) => updateCreationCost('attributeMax', parseInt(e.target.value) || 5)}
                                    className="w-20 p-2 border border-slate-300 rounded text-center font-bold"
                                />
                                <span className="text-xs text-slate-400 font-bold w-6">pts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminCostsEditor;
