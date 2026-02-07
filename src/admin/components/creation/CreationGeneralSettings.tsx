import React from 'react';
import { Sliders } from 'lucide-react';
import { RulesCreationConfig } from '../../../types/rules';

interface CreationGeneralSettingsProps {
    config: RulesCreationConfig;
    onUpdateConfig: (field: string, value: any) => void;
    onUpdatePointsBuckets: (bucket: 'attributes' | 'skills' | 'backgrounds', value: number) => void;
}

const CreationGeneralSettings: React.FC<CreationGeneralSettingsProps> = ({
    config,
    onUpdateConfig,
    onUpdatePointsBuckets
}) => {
    return (
        <div className="bg-slate-50 p-6 rounded shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
                <Sliders size={18} className="text-blue-600" /> Paramètres de Création
            </h4>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded border border-slate-200">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Attribut Minimal</label>
                        <input
                            type="number"
                            value={config.attributeMin ?? -1}
                            onChange={(e) => onUpdateConfig('attributeMin', parseInt(e.target.value))}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Attribut Maximal</label>
                        <input
                            type="number"
                            value={config.attributeMax ?? 3}
                            onChange={(e) => onUpdateConfig('attributeMax', parseInt(e.target.value))}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-600 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Méthode de Création</label>
                    <div className="flex bg-slate-200 p-1 rounded">
                        <button
                            onClick={() => onUpdateConfig('mode', 'rangs')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${config.mode === 'rangs' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Par Rangs
                        </button>
                        <button
                            onClick={() => onUpdateConfig('mode', 'points')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${config.mode === 'points' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Par Points (XP)
                        </button>
                    </div>
                </div>

                {config.mode === 'points' && (
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Répartition</label>
                            <div className="flex bg-slate-200 p-1 rounded">
                                <button
                                    onClick={() => onUpdateConfig('pointsDistributionMode', 'global')}
                                    className={`flex-1 py-1 text-xs font-bold uppercase rounded transition-all ${(!config.pointsDistributionMode || config.pointsDistributionMode === 'global') ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Pot Commun
                                </button>
                                <button
                                    onClick={() => onUpdateConfig('pointsDistributionMode', 'buckets')}
                                    className={`flex-1 py-1 text-xs font-bold uppercase rounded transition-all ${config.pointsDistributionMode === 'buckets' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Budgets Séparés
                                </button>
                            </div>
                        </div>

                        {(!config.pointsDistributionMode || config.pointsDistributionMode === 'global') ? (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">XP de Départ (Global)</label>
                                <input
                                    type="number"
                                    value={config.startingXP || 0}
                                    onChange={(e) => onUpdateConfig('startingXP', parseInt(e.target.value) || 0)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-lg"
                                />
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">XP Attributs</label>
                                    <input
                                        type="number"
                                        value={config.pointsBuckets?.attributes || 0}
                                        onChange={(e) => onUpdatePointsBuckets('attributes', parseInt(e.target.value) || 0)}
                                        className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">XP Compétences</label>
                                    <input
                                        type="number"
                                        value={config.pointsBuckets?.skills || 0}
                                        onChange={(e) => onUpdatePointsBuckets('skills', parseInt(e.target.value) || 0)}
                                        className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">XP Arrière-plans</label>
                                    <input
                                        type="number"
                                        value={config.pointsBuckets?.backgrounds || 0}
                                        onChange={(e) => onUpdatePointsBuckets('backgrounds', parseInt(e.target.value) || 0)}
                                        className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {config.mode === 'rangs' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Pts Attributs</label>
                            <input
                                type="number"
                                value={config.attributePoints || 0}
                                onChange={(e) => onUpdateConfig('attributePoints', parseInt(e.target.value) || 0)}
                                className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Pts Arr. Plans</label>
                            <input
                                type="number"
                                value={config.backgroundPoints || 0}
                                onChange={(e) => onUpdateConfig('backgroundPoints', parseInt(e.target.value) || 0)}
                                className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
};

export default CreationGeneralSettings;
