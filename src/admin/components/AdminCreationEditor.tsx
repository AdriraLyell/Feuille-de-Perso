import React from 'react';
import { RulesData } from '../../types/rules';
import { Sliders, Settings, Activity, Coins, Zap } from 'lucide-react';
import CreationGeneralSettings from './creation/CreationGeneralSettings';
import RankSlotsConfig from './creation/RankSlotsConfig';
import CreationPointsPreview from './creation/CreationPointsPreview';
import CardSystemConfig from './creation/CardSystemConfig';

interface AdminCreationEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminCreationEditor: React.FC<AdminCreationEditorProps> = ({ rules, onUpdate }) => {
    const config = rules.configurations.creation;
    const cardConfig = rules.configurations.cards;

    const updateCreationConfig = (field: string, value: any) => {
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

    const updatePointsBuckets = (bucket: 'attributes' | 'skills' | 'backgrounds', value: number) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                creation: {
                    ...rules.configurations.creation,
                    pointsBuckets: {
                        ...(rules.configurations.creation.pointsBuckets || { attributes: 0, skills: 0, backgrounds: 0 }),
                        [bucket]: value
                    }
                }
            }
        });
    };

    const updateCardConfig = (field: string, value: any) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                cards: {
                    ...rules.configurations.cards,
                    [field]: value
                }
            }
        });
    };

    const updateXPCost = (field: string, value: number) => {
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

    const updateRankSlot = (rank: number, value: number) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                creation: {
                    ...rules.configurations.creation,
                    rankSlots: {
                        ...rules.configurations.creation.rankSlots,
                        [rank]: value
                    }
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header / Config Générale */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider leading-none">Configuration Générale</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Réglages globaux du système de règles</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-2">Version des Règles</span>
                        <input
                            type="text"
                            value={rules.version}
                            onChange={(e) => onUpdate({ ...rules, version: e.target.value })}
                            className="w-32 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 text-center font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-all outline-none"
                            placeholder="1.0.0"
                        />
                    </div>
                </div>
            </div>

            {/* Cartes de réglages rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card Rangs Etendus */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Rangs Étendus</h4>
                            <p className="text-[10px] text-slate-400 font-medium italic">Autoriser les scores &gt; 5</p>
                        </div>
                    </div>
                    <button
                        onClick={() => updateCreationConfig('extendedSkills', !config.extendedSkills)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors relative ${config.extendedSkills ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${config.extendedSkills ? 'translate-x-6' : ''}`} />
                    </button>
                </div>

                {/* Card Coût Arrière-plan */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                            <Coins size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Coût de base Arrière-Plans</h4>
                            <p className="text-[10px] text-slate-400 font-medium italic">XP de base (avant multiplicateur de colonne)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={config.backgroundCost ?? 2}
                            onChange={(e) => updateCreationConfig('backgroundCost', parseInt(e.target.value) || 0)}
                            className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-mono font-bold text-slate-700 focus:border-blue-500 outline-none"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">XP</span>
                    </div>
                </div>

                {/* Card Coût Attributs */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Coût Attributs</h4>
                            <p className="text-[10px] text-slate-400 font-medium italic">XP par point (linéaire)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={rules.configurations.xpCosts.attributeFactor ?? 6}
                            onChange={(e) => updateXPCost('attributeFactor', parseInt(e.target.value) || 0)}
                            className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-mono font-bold text-slate-700 focus:border-blue-500 outline-none"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">XP</span>
                    </div>
                </div>
            </div>

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CreationGeneralSettings
                    config={config}
                    onUpdateConfig={updateCreationConfig}
                    onUpdatePointsBuckets={updatePointsBuckets}
                />

                <div className="flex flex-col gap-6">
                    {config.mode === 'rangs' && (
                        <RankSlotsConfig
                            rankSlots={config.rankSlots}
                            onUpdateRankSlot={updateRankSlot}
                        />
                    )}

                    {config.mode === 'points' && config.pointsDistributionMode === 'buckets' && (
                        <CreationPointsPreview
                            pointsBuckets={config.pointsBuckets || { attributes: 0, skills: 0, backgrounds: 0 }}
                        />
                    )}
                </div>
            </div>

            <hr className="border-slate-200 mx-10" />

            <CardSystemConfig
                config={cardConfig}
                onUpdateCardConfig={updateCardConfig}
            />
        </div>
    );
};

export default AdminCreationEditor;
