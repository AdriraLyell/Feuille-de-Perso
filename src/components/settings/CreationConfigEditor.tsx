
import React from 'react';
import { CharacterSheetData } from '../../types';
import { Sliders, List, PieChart, CreditCard, Info } from 'lucide-react';

interface CreationConfigEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

const CreationConfigEditor: React.FC<CreationConfigEditorProps> = ({ data, onUpdate, onAddLog }) => {
    const config = data.creationConfig;
    if (!config) return null;

    const updateCreationConfig = (field: string, value: any) => {
        onUpdate({
            ...data,
            creationConfig: {
                ...data.creationConfig,
                [field]: value
            }
        });
        onAddLog(`Config Création modifiée : ${field}`, 'info', 'settings');
    };
    
    const updatePointsBuckets = (bucket: 'attributes' | 'skills' | 'backgrounds', value: number) => {
        onUpdate({
            ...data,
            creationConfig: {
                ...data.creationConfig,
                pointsBuckets: {
                    ...(data.creationConfig.pointsBuckets || { attributes: 0, skills: 0, backgrounds: 0 }),
                    [bucket]: value
                }
            }
        });
    };
    
    const updateCardConfig = (field: string, value: any) => {
        onUpdate({
            ...data,
            creationConfig: {
                ...data.creationConfig,
                cardConfig: {
                    ...data.creationConfig.cardConfig,
                    [field]: value
                }
            }
        });
    };

    const updateRankSlot = (rank: number, value: number) => {
        onUpdate({
            ...data,
            creationConfig: {
                ...data.creationConfig,
                rankSlots: {
                    ...data.creationConfig.rankSlots,
                    [rank]: value
                }
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                
                {/* General Settings */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                    <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                        <Sliders size={18} /> Paramètres de Création
                    </h4>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Méthode de Création</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => updateCreationConfig('mode', 'rangs')}
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${config.mode === 'rangs' ? 'bg-white text-blue-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Par Rangs
                                </button>
                                <button 
                                    onClick={() => updateCreationConfig('mode', 'points')}
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${config.mode === 'points' ? 'bg-white text-blue-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Par Points (XP)
                                </button>
                            </div>
                        </div>

                        {config.mode === 'points' && (
                            <div className="space-y-4">
                                {/* Sub-mode selector */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Type de Répartition</label>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button 
                                            onClick={() => updateCreationConfig('pointsDistributionMode', 'global')}
                                            className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${(!config.pointsDistributionMode || config.pointsDistributionMode === 'global') ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Pot Commun
                                        </button>
                                        <button 
                                            onClick={() => updateCreationConfig('pointsDistributionMode', 'buckets')}
                                            className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${config.pointsDistributionMode === 'buckets' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Budgets Séparés
                                        </button>
                                    </div>
                                </div>

                                {(!config.pointsDistributionMode || config.pointsDistributionMode === 'global') ? (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">XP de Départ (Global)</label>
                                        <input 
                                            type="number" 
                                            value={config.startingXP || 0}
                                            onChange={(e) => updateCreationConfig('startingXP', parseInt(e.target.value) || 0)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-lg"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">XP Attributs</label>
                                            <input 
                                                type="number" 
                                                value={config.pointsBuckets?.attributes || 0}
                                                onChange={(e) => updatePointsBuckets('attributes', parseInt(e.target.value) || 0)}
                                                className="w-full border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">XP Compétences</label>
                                            <input 
                                                type="number" 
                                                value={config.pointsBuckets?.skills || 0}
                                                onChange={(e) => updatePointsBuckets('skills', parseInt(e.target.value) || 0)}
                                                className="w-full border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">XP Arrière-plans</label>
                                            <input 
                                                type="number" 
                                                value={config.pointsBuckets?.backgrounds || 0}
                                                onChange={(e) => updatePointsBuckets('backgrounds', parseInt(e.target.value) || 0)}
                                                className="w-full border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {config.mode === 'rangs' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pts Attributs</label>
                                    <input 
                                        type="number" 
                                        value={config.attributePoints || 0}
                                        onChange={(e) => updateCreationConfig('attributePoints', parseInt(e.target.value) || 0)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pts Arr. Plans</label>
                                    <input 
                                        type="number" 
                                        value={config.backgroundPoints || 0}
                                        onChange={(e) => updateCreationConfig('backgroundPoints', parseInt(e.target.value) || 0)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Attr. Min (Défaut -2)</label>
                                <input 
                                    type="number" 
                                    value={config.attributeMin ?? -2}
                                    onChange={(e) => updateCreationConfig('attributeMin', parseInt(e.target.value))}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Attr. Max (Défaut 3)</label>
                                <input 
                                    type="number" 
                                    value={config.attributeMax ?? 3}
                                    onChange={(e) => updateCreationConfig('attributeMax', parseInt(e.target.value))}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Rank Slots or Colors */}
                <div className="flex flex-col gap-6">

                    {/* Rank Slots Configuration (Only if mode is 'rangs') */}
                    {config.mode === 'rangs' && (
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                            <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                <List size={18} /> Répartition des Rangs
                            </h4>
                            <div className="space-y-3">
                                {[5, 4, 3, 2, 1].map(rank => (
                                    <div key={rank} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                        <span className="font-bold text-gray-600">Rang {rank}</span>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                // @ts-ignore
                                                value={config.rankSlots[rank] || 0}
                                                onChange={(e) => updateRankSlot(rank, parseInt(e.target.value) || 0)}
                                                className="w-20 border border-gray-300 rounded px-2 py-1 text-center font-mono focus:border-blue-500 outline-none"
                                            />
                                            <span className="text-sm text-gray-400">rangs</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Distribution Preview for Points Mode (Buckets) */}
                    {config.mode === 'points' && config.pointsDistributionMode === 'buckets' && (
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                            <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                <PieChart size={18} /> Répartition Totale
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Attributs</span>
                                    <span className="font-bold">{config.pointsBuckets?.attributes || 0} XP</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Compétences</span>
                                    <span className="font-bold">{config.pointsBuckets?.skills || 0} XP</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Arrière-plans</span>
                                    <span className="font-bold">{config.pointsBuckets?.backgrounds || 0} XP</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                    <span className="font-bold text-gray-800">Total</span>
                                    <span className="font-bold text-blue-600 text-lg">
                                        {(config.pointsBuckets?.attributes || 0) + (config.pointsBuckets?.skills || 0) + (config.pointsBuckets?.backgrounds || 0)} XP
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

            </div>

            {/* Separator */}
            <hr className="border-gray-200" />

            {/* Card System Configuration - INDEPENDENT FROM CREATION MODE */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard size={18} /> Système de Carte (Calcul Automatique)
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">{config.cardConfig?.active ? 'ACTIF' : 'INACTIF'}</span>
                        <button 
                            onClick={() => updateCardConfig('active', !config.cardConfig?.active)}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.cardConfig?.active ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${config.cardConfig?.active ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity ${config.cardConfig?.active ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Compétences à retenir</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number"
                                value={config.cardConfig?.bestSkillsCount ?? 6}
                                onChange={(e) => updateCardConfig('bestSkillsCount', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                            />
                            <div title="Nombre de meilleures compétences utilisées pour la moyenne">
                                <Info size={16} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Incrément par Palier</label>
                        <input 
                            type="number"
                            step="0.1"
                            value={config.cardConfig?.increment ?? 0.5}
                            onChange={(e) => updateCardConfig('increment', parseFloat(e.target.value))}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Seuil de Base (Valet)</label>
                        <input 
                            type="number"
                            step="0.1"
                            value={config.cardConfig?.baseStart ?? 2}
                            onChange={(e) => updateCardConfig('baseStart', parseFloat(e.target.value))}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CreationConfigEditor;
