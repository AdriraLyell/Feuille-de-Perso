import React from 'react';
import { Loader2 } from 'lucide-react';
import { GameSettingSummary } from '../../../services/CampaignService';

interface CampaignSelectorProps {
    settings: GameSettingSummary[];
    onSelect: (id: string) => void;
}

export const CampaignSelector: React.FC<CampaignSelectorProps> = ({ settings, onSelect }) => {
    return (
        <div className="flex-grow flex flex-col p-6 overflow-hidden">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">Choisir une campagne cible</h3>
                <p className="text-sm text-slate-500">Ce personnage est un "orphelin" (sans campagne). Veuillez sélectionner la campagne où importer ses caractéristiques.</p>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {settings.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <Loader2 className="animate-spin mx-auto mb-2" />
                        Chargement des campagnes...
                    </div>
                ) : (
                    settings.map((s: GameSettingSummary) => (
                        <button
                            key={s.id}
                            onClick={() => onSelect(s.id)}
                            className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left flex items-center justify-between group"
                        >
                            <div>
                                <div className="font-bold text-slate-800 group-hover:text-indigo-700">{s.name}</div>
                                <div className="text-xs text-slate-400">ID: {s.id.substring(0, 8)}...</div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 text-indigo-500 font-bold text-sm">Choisir →</div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
