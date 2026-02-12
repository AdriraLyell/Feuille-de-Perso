import React from 'react';
import { Info, MessageSquare, Eye, EyeOff } from 'lucide-react';

interface CampaignMetadataSettingsProps {
    description?: string;
    welcomeMessage?: string;
    showMetadataToPlayers: boolean;
    onUpdate: (field: string, value: any) => void;
}

const CampaignMetadataSettings: React.FC<CampaignMetadataSettingsProps> = ({
    description = '',
    welcomeMessage = '',
    showMetadataToPlayers,
    onUpdate
}) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider leading-none">Informations de Campagne</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Détails visibles par les joueurs (optionnel)</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visibilité Joueurs</span>
                    <button
                        onClick={() => onUpdate('showMetadataToPlayers', !showMetadataToPlayers)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-all ${showMetadataToPlayers
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                    >
                        {showMetadataToPlayers ? <Eye size={14} /> : <EyeOff size={14} />}
                        {showMetadataToPlayers ? "Activée" : "Désactivée"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Description MJ */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        <Info size={12} /> Description de la Campagne
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        placeholder="Ex: Campagne médiévale-fantastique dans le monde d'Adrira..."
                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
                    />
                </div>

                {/* Message d'accueil */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        <MessageSquare size={12} /> Message d'accueil Joueurs
                    </label>
                    <textarea
                        value={welcomeMessage}
                        onChange={(e) => onUpdate('welcomeMessage', e.target.value)}
                        placeholder="Ex: Bienvenue aventuriers ! N'oubliez pas de consulter le guide des règles..."
                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
                    />
                </div>
            </div>

            {!showMetadataToPlayers && (
                <p className="text-[10px] text-amber-600 font-medium italic flex items-center gap-1 mt-2">
                    <EyeOff size={12} /> Ces informations ne sont actuellement pas visibles par les joueurs sur leur fiche.
                </p>
            )}
        </div>
    );
};

export default CampaignMetadataSettings;
