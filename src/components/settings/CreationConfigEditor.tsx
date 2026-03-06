
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

    const updateCreationConfig = (field: string, value: string | number | boolean) => {
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

    const updateCardConfig = (field: string, value: string | number | boolean) => {
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
                <div className="bg-[#fdfbf7]/80 backdrop-blur-sm p-6 rounded-sm shadow-md border border-[#bfae85]/30">
                    <h4 className="font-bold text-[#5c4d41] border-b border-[#bfae85]/30 pb-2 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
                        <Sliders size={18} className="text-[#8b2e2e]" /> Paramètres de Création
                    </h4>

                    <div className="space-y-4">
                        {/* Extended Skills Toggle */}
                        <div className="flex items-center justify-between bg-[#bfae85]/10 p-2 rounded-sm border border-[#bfae85]/20 mb-4">
                            <span className="text-[10px] font-bold text-[#8b2e2e] uppercase tracking-widest">Rangs Étendus (6+)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-[#5c4d41]/60 tracking-widest">{config.extendedSkills ? 'ACTIF' : 'INACTIF'}</span>
                                <button
                                    onClick={() => updateCreationConfig('extendedSkills', !config.extendedSkills)}
                                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${config.extendedSkills ? 'bg-[#8b2e2e]' : 'bg-stone-300'}`}
                                    aria-pressed={config.extendedSkills}
                                    title={config.extendedSkills ? 'Désactiver les rangs étendus' : 'Activer les rangs étendus'}
                                >
                                    <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${config.extendedSkills ? 'translate-x-4' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <span className="block text-[10px] font-bold text-[#8b2e2e] uppercase tracking-widest mb-1.5">Méthode de Création</span>
                            <div className="flex bg-stone-200/50 p-1 rounded-sm border border-stone-300/30">
                                <button
                                    onClick={() => updateCreationConfig('mode', 'rangs')}
                                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition ${config.mode === 'rangs' ? 'bg-[#8b2e2e] text-white shadow-md' : 'text-[#5c4d41]/60 hover:text-[#5c4d41]'}`}
                                >
                                    Par Rangs
                                </button>
                                <button
                                    onClick={() => updateCreationConfig('mode', 'points')}
                                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition ${config.mode === 'points' ? 'bg-[#8b2e2e] text-white shadow-md' : 'text-[#5c4d41]/60 hover:text-[#5c4d41]'}`}
                                >
                                    Par Points (XP)
                                </button>
                            </div>
                        </div>

                        {config.mode === 'points' && (
                            <div className="space-y-4">
                                {/* Sub-mode selector */}
                                <div>
                                    <span className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-tighter">Type de Répartition</span>
                                    <div className="flex bg-stone-200/50 p-1 rounded-sm border border-stone-300/30">
                                        <button
                                            onClick={() => updateCreationConfig('pointsDistributionMode', 'global')}
                                            className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-sm transition ${(!config.pointsDistributionMode || config.pointsDistributionMode === 'global') ? 'bg-[#5c4d41] text-white shadow-sm' : 'text-[#5c4d41]/60 hover:text-[#5c4d41]'}`}
                                        >
                                            Pot Commun
                                        </button>
                                        <button
                                            onClick={() => updateCreationConfig('pointsDistributionMode', 'buckets')}
                                            className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-sm transition ${config.pointsDistributionMode === 'buckets' ? 'bg-[#5c4d41] text-white shadow-sm' : 'text-[#5c4d41]/60 hover:text-[#5c4d41]'}`}
                                        >
                                            Budgets Séparés
                                        </button>
                                    </div>
                                </div>

                                {(!config.pointsDistributionMode || config.pointsDistributionMode === 'global') ? (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label htmlFor="starting-xp-global" className="block text-sm font-bold text-gray-700 mb-1">XP de Départ (Global)</label>
                                        <input
                                            id="starting-xp-global"
                                            type="number"
                                            value={config.startingXP || 0}
                                            onChange={(e) => updateCreationConfig('startingXP', parseInt(e.target.value) || 0)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-lg"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label htmlFor="xp-bucket-attributes" className="block text-xs font-bold text-gray-500 mb-1 uppercase">XP Attributs</label>
                                            <input
                                                id="xp-bucket-attributes"
                                                type="number"
                                                value={config.pointsBuckets?.attributes || 0}
                                                onChange={(e) => updatePointsBuckets('attributes', parseInt(e.target.value) || 0)}
                                                className="w-full border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="xp-bucket-skills" className="block text-xs font-bold text-gray-500 mb-1 uppercase">XP Compétences</label>
                                            <input
                                                id="xp-bucket-skills"
                                                type="number"
                                                value={config.pointsBuckets?.skills || 0}
                                                onChange={(e) => updatePointsBuckets('skills', parseInt(e.target.value) || 0)}
                                                className="w-full border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="xp-bucket-backgrounds" className="block text-xs font-bold text-gray-500 mb-1 uppercase">XP Arrière-plans</label>
                                            <input
                                                id="xp-bucket-backgrounds"
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
                                    <label htmlFor="pts-attributes-rangs" className="block text-sm font-bold text-gray-700 mb-1">Pts Attributs</label>
                                    <input
                                        id="pts-attributes-rangs"
                                        type="number"
                                        value={config.attributePoints || 0}
                                        onChange={(e) => updateCreationConfig('attributePoints', parseInt(e.target.value) || 0)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="pts-backgrounds-rangs" className="block text-sm font-bold text-gray-700 mb-1">Pts Arr. Plans</label>
                                    <input
                                        id="pts-backgrounds-rangs"
                                        type="number"
                                        value={config.backgroundPoints || 0}
                                        onChange={(e) => updateCreationConfig('backgroundPoints', parseInt(e.target.value) || 0)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 bg-[#bfae85]/10 p-3 rounded-sm border border-[#bfae85]/30">
                            <div>
                                <label htmlFor="attr-min-value" className="block text-[10px] font-bold text-[#5c4d41]/60 mb-1 uppercase tracking-widest">Attr. Min</label>
                                <input
                                    id="attr-min-value"
                                    type="number"
                                    value={config.attributeMin ?? -2}
                                    onChange={(e) => updateCreationConfig('attributeMin', parseInt(e.target.value))}
                                    className="w-full border border-[#bfae85]/40 rounded-sm px-2 py-1 text-xs focus:border-[#8b2e2e] outline-none bg-white font-bold text-[#2c241b]"
                                />
                            </div>
                            <div>
                                <label htmlFor="attr-max-value" className="block text-[10px] font-bold text-[#5c4d41]/60 mb-1 uppercase tracking-widest">Attr. Max</label>
                                <input
                                    id="attr-max-value"
                                    type="number"
                                    value={config.attributeMax ?? 3}
                                    onChange={(e) => updateCreationConfig('attributeMax', parseInt(e.target.value))}
                                    className="w-full border border-[#bfae85]/40 rounded-sm px-2 py-1 text-xs focus:border-[#8b2e2e] outline-none bg-white font-bold text-[#2c241b]"
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
                                                value={(config.rankSlots as Record<number, number>)[rank] || 0}
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
            <hr className="border-[#bfae85]/30 mx-10" />

            {/* Card System Configuration - INDEPENDENT FROM CREATION MODE */}
            <div className="bg-[#fdfbf7]/80 backdrop-blur-sm p-6 rounded-sm shadow-md border border-[#bfae85]/30">
                <div className="flex items-center justify-between border-b border-[#bfae85]/30 pb-2 mb-4">
                    <h4 className="font-bold text-[#5c4d41] flex items-center gap-2 uppercase tracking-widest text-sm">
                        <CreditCard size={18} className="text-[#8b2e2e]" /> Système de Carte
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#5c4d41]/40 tracking-widest">{config.cardConfig?.active ? 'ACTIF' : 'INACTIF'}</span>
                        <button
                            onClick={() => updateCardConfig('active', !config.cardConfig?.active)}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.cardConfig?.active ? 'bg-[#166534]' : 'bg-stone-300'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${config.cardConfig?.active ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity ${config.cardConfig?.active ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                    <div>
                        <label 
                            htmlFor="card-skills-count"
                            className="block text-[10px] font-bold text-[#bfae85] mb-1 uppercase tracking-tighter"
                        >
                            Compétences retenues
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="card-skills-count"
                                type="number"
                                value={config.cardConfig?.bestSkillsCount ?? 6}
                                onChange={(e) => updateCardConfig('bestSkillsCount', parseInt(e.target.value))}
                                className="w-full border border-[#bfae85]/40 rounded-sm px-3 py-1.5 focus:border-[#8b2e2e] outline-none bg-white font-bold"
                            />
                            <div title="Nombre de meilleures compétences utilisées pour la moyenne">
                                <Info size={16} className="text-[#bfae85]" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label 
                            htmlFor="card-increment"
                            className="block text-xs font-bold text-gray-500 mb-1 uppercase"
                        >
                            Incrément par Palier
                        </label>
                        <input
                            id="card-increment"
                            type="number"
                            step="0.1"
                            value={config.cardConfig?.increment ?? 0.5}
                            onChange={(e) => updateCardConfig('increment', parseFloat(e.target.value))}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label 
                            htmlFor="card-base-start"
                            className="block text-xs font-bold text-gray-500 mb-1 uppercase"
                        >
                            Seuil de Base (Valet)
                        </label>
                        <input
                            id="card-base-start"
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
