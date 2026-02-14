import React from 'react';
import { RulesData } from '../../../types/rules';
import { Info, MessageSquare, Eye, EyeOff } from 'lucide-react';

interface CampaignMetadataSettingsProps {
    description?: string;
    welcomeMessage?: string;
    showMetadataToPlayers: boolean;
    onUpdate: <K extends keyof RulesData>(field: K, value: RulesData[K]) => void;
}

const CampaignMetadataSettings: React.FC<CampaignMetadataSettingsProps> = ({
    description = '',
    welcomeMessage = '',
    showMetadataToPlayers,
    onUpdate
}) => {
    return (
        <div className="bg-stone-900/40 p-6 rounded-sm shadow-sm border border-stone-700/50 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-700/50 pb-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-900/20 text-amber-500 rounded-sm border border-amber-900/30">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-serif font-bold text-amber-500 uppercase tracking-widest leading-none">Informations de Campagne</h3>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Détails visibles par les joueurs (optionnel)</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-stone-950/30 px-3 py-1.5 rounded-sm border border-stone-700">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Visibilité Joueurs</span>
                    <button
                        onClick={() => onUpdate('showMetadataToPlayers', !showMetadataToPlayers)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-bold transition-all uppercase tracking-wider ${showMetadataToPlayers
                            ? 'bg-amber-600 text-stone-900 shadow-glow-gold'
                            : 'bg-stone-800 text-stone-500'
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
                    <label htmlFor="campaign-description" className="flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">
                        <Info size={12} /> Description de la Campagne
                    </label>
                    <textarea
                        id="campaign-description"
                        value={description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        placeholder="Ex: Campagne médiévale-fantastique dans le monde d'Adrira..."
                        className="w-full h-24 bg-stone-950 border border-stone-700 rounded-sm p-3 text-sm text-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all outline-none resize-none placeholder-stone-700"
                    />
                </div>

                {/* Message d'accueil */}
                <div className="space-y-2">
                    <label htmlFor="welcome-message" className="flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">
                        <MessageSquare size={12} /> Message d'accueil Joueurs
                    </label>
                    <textarea
                        id="welcome-message"
                        value={welcomeMessage}
                        onChange={(e) => onUpdate('welcomeMessage', e.target.value)}
                        placeholder="Ex: Bienvenue aventuriers ! N'oubliez pas de consulter le guide des règles..."
                        className="w-full h-24 bg-stone-950 border border-stone-700 rounded-sm p-3 text-sm text-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all outline-none resize-none placeholder-stone-700"
                    />
                </div>
            </div>

            {!showMetadataToPlayers && (
                <p className="text-[10px] text-amber-700 font-bold italic flex items-center gap-2 mt-2 bg-amber-900/10 p-2 rounded border border-amber-900/20 w-fit">
                    <EyeOff size={12} /> Ces informations ne sont actuellement pas visibles par les joueurs.
                </p>
            )}
        </div>
    );
};

export default CampaignMetadataSettings;
