import React from 'react';
import { CreditCard, Info } from 'lucide-react';
import { RulesCardConfig } from '../../../types/rules';

interface CardSystemConfigProps {
    config: RulesCardConfig;
    onUpdateCardConfig: (field: string, value: any) => void;
}

const CardSystemConfig: React.FC<CardSystemConfigProps> = ({ config, onUpdateCardConfig }) => {
    return (
        <div className="bg-slate-50 p-6 rounded shadow-sm border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-widest text-sm">
                    <CreditCard size={18} className="text-blue-600" /> Système de Carte
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest">{config?.active ? 'ACTIF' : 'INACTIF'}</span>
                    <button
                        onClick={() => onUpdateCardConfig('active', !config?.active)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config?.active ? 'bg-green-600' : 'bg-slate-300'}`}
                    >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${config?.active ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity ${config?.active ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tighter">Compétences retenues</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={config?.bestSkillsCount ?? 6}
                            onChange={(e) => onUpdateCardConfig('bestSkillsCount', parseInt(e.target.value))}
                            className="w-full border border-slate-300 rounded px-3 py-1.5 focus:border-blue-600 outline-none bg-white font-bold"
                        />
                        <div title="Nombre de meilleures compétences utilisées pour la moyenne">
                            <Info size={16} className="text-slate-400" />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Incrément par Palier</label>
                    <input
                        type="number"
                        step="0.1"
                        value={config?.increment ?? 0.5}
                        onChange={(e) => onUpdateCardConfig('increment', parseFloat(e.target.value))}
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:border-blue-600 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Seuil de Base (Valet)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={config?.baseStart ?? 2}
                        onChange={(e) => onUpdateCardConfig('baseStart', parseFloat(e.target.value))}
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:border-blue-600 outline-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default CardSystemConfig;
