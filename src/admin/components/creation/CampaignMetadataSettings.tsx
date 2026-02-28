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
        <div className="bg-stone-900/40 p-4 rounded-sm shadow-sm border border-stone-700/50 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-700/50 pb-2 mb-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-900/20 text-amber-500 rounded-sm border border-amber-900/30">
                        <Info size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-serif font-bold text-amber-500 uppercase tracking-widest leading-none">Infos Campagne</h3>
                        <p className="text-[9px] text-stone-600 font-bold uppercase tracking-widest mt-0.5">Visibles par les joueurs</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-stone-950/30 px-2 py-1 rounded-sm border border-stone-700">
                    <span className="text-[9px] font-bold text-stone-600 uppercase tracking-widest">Visibilité</span>
                    <button
                        onClick={() => onUpdate('showMetadataToPlayers', !showMetadataToPlayers)}
                        className={`flex items-center gap-2 px-2 py-0.5 rounded-sm text-[10px] font-bold transition-all uppercase tracking-wider ${showMetadataToPlayers
                            ? 'bg-amber-600 text-stone-900 shadow-glow-gold'
                            : 'bg-stone-800 text-stone-500'
                            }`}
                    >
                        {showMetadataToPlayers ? <Eye size={12} /> : <EyeOff size={12} />}
                        {showMetadataToPlayers ? "ON" : "OFF"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Description MJ */}
                <div className="space-y-1">
                    <label htmlFor="campaign-description" className="flex items-center gap-2 text-[9px] font-bold text-stone-500 uppercase tracking-widest ml-1">
                        <Info size={10} /> Description
                    </label>
                    <textarea
                        id="campaign-description"
                        value={description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        placeholder="Ex: Campagne médiévale-fantastique..."
                        className="w-full h-16 bg-stone-950 border border-stone-700 rounded-sm p-2 text-xs text-stone-300 focus:border-amber-500 outline-none resize-none placeholder-stone-800"
                    />
                </div>

                {/* Message d'accueil */}
                <div className="space-y-1">
                    <label htmlFor="welcome-message" className="flex items-center gap-2 text-[9px] font-bold text-stone-500 uppercase tracking-widest ml-1">
                        <MessageSquare size={10} /> Accueil Joueurs
                    </label>
                    <textarea
                        id="welcome-message"
                        value={welcomeMessage}
                        onChange={(e) => onUpdate('welcomeMessage', e.target.value)}
                        placeholder="Ex: Bienvenue aventuriers !..."
                        className="w-full h-16 bg-stone-950 border border-stone-700 rounded-sm p-2 text-xs text-stone-300 focus:border-amber-500 outline-none resize-none placeholder-stone-800"
                    />
                </div>
            </div>

        </div>
    );
};

export default CampaignMetadataSettings;
