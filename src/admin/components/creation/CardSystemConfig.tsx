import React from 'react';
import { CreditCard, Info } from 'lucide-react';
import { RulesCardConfig } from '../../../types/rules';

interface CardSystemConfigProps {
    config: RulesCardConfig;
    onUpdateCardConfig: <K extends keyof RulesCardConfig>(field: K, value: RulesCardConfig[K]) => void;
}

const CardSystemConfig: React.FC<CardSystemConfigProps> = ({ config, onUpdateCardConfig }) => {
    return (
        <div className="bg-stone-900/40 p-6 rounded-sm shadow-sm border border-stone-700/50">
            <div className="flex items-center justify-between border-b border-stone-700/50 pb-2 mb-4">
                <h4 className="font-serif font-bold text-stone-300 flex items-center gap-2 uppercase tracking-widest text-sm">
                    <CreditCard size={18} className="text-amber-500" /> Système de Carte
                </h4>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black tracking-widest ${config?.active ? 'text-amber-500' : 'text-stone-600'}`}>
                        {config?.active ? 'ACTIF' : 'INACTIF'}
                    </span>
                    <button
                        onClick={() => onUpdateCardConfig('active', !config?.active)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors border ${config?.active ? 'bg-amber-600 border-amber-500 shadow-glow-gold' : 'bg-stone-800 border-stone-600'}`}
                    >
                        <div className={`bg-stone-200 w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform ${config?.active ? 'translate-x-4' : ''}`} />
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity ${config?.active ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-tighter">Compétences retenues</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={config?.bestSkillsCount ?? 6}
                            onChange={(e) => onUpdateCardConfig('bestSkillsCount', parseInt(e.target.value))}
                            className="w-full bg-stone-950 border border-stone-700 rounded-sm px-3 py-1.5 focus:border-amber-500 outline-none font-bold text-stone-200"
                        />
                        <div title="Nombre de meilleures compétences utilisées pour la moyenne">
                            <Info size={16} className="text-stone-500" />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">Incrément par Palier</label>
                    <input
                        type="number"
                        step="0.1"
                        value={config?.increment ?? 0.5}
                        onChange={(e) => onUpdateCardConfig('increment', parseFloat(e.target.value))}
                        className="w-full bg-stone-950 border border-stone-700 rounded-sm px-3 py-2 focus:border-amber-500 outline-none text-stone-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">Seuil de Base (Valet)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={config?.baseStart ?? 2}
                        onChange={(e) => onUpdateCardConfig('baseStart', parseFloat(e.target.value))}
                        className="w-full bg-stone-950 border border-stone-700 rounded-sm px-3 py-2 focus:border-amber-500 outline-none text-stone-200"
                    />
                </div>
            </div>
        </div>
    );
};

export default CardSystemConfig;
