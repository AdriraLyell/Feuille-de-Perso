import React from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { GameSettingSummary } from '../../../services/CampaignService';
import { CharacterSheetData } from '../../../types/character';
import SyncHistoryTab from './SyncHistoryTab';
import { CharacterHistoryEntry } from '../../../services/CharacterSyncService';

interface SyncViewTabProps {
    characterData: CharacterSheetData;
    campaigns: GameSettingSummary[];
    selectedCampaign: string;
    setSelectedCampaign: (id: string) => void;
    playerName: string;
    setPlayerName: (name: string) => void;
    characterName: string;
    setCharacterName: (name: string) => void;
    isAutoSync: boolean;
    setIsAutoSync: (enabled: boolean) => void;
    status: 'idle' | 'loading' | 'success' | 'error';
    errorMessage: string;
    isLoadingCampaigns: boolean;
    isOnlineMode: boolean;
    cloudVersion: { lastSynced: number, mjMessage?: string } | null;
    history: CharacterHistoryEntry[];
    isLoadingHistory: boolean;
    isRestoring: boolean;
    onRestore: (entry: CharacterHistoryEntry) => void;
}

const SyncViewTab: React.FC<SyncViewTabProps> = ({
    characterData,
    campaigns,
    selectedCampaign,
    setSelectedCampaign,
    playerName,
    setPlayerName,
    characterName,
    setCharacterName,
    isAutoSync,
    setIsAutoSync,
    status,
    errorMessage,
    isLoadingCampaigns,
    isOnlineMode,
    cloudVersion,
    history,
    isLoadingHistory,
    isRestoring,
    onRestore
}) => {
    return (
        <div className="space-y-5 animate-in fade-in duration-300 overflow-y-auto pr-1">
            {/* Cloud Update Status Indicator */}
            {cloudVersion && characterData.syncInfo && cloudVersion.lastSynced > (characterData.syncInfo.lastSynced || 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                        <AlertTriangle size={18} className="text-amber-600" />
                        Mise à jour disponible sur le Cloud
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed mb-2">
                        Le Gardien ou un autre dispositif a synchronisé une version plus récente ({new Date(cloudVersion.lastSynced).toLocaleString()}).
                        Il est recommandé de vérifier l'onglet <strong>Bibliothèque Cloud</strong> avant d'écraser.
                    </p>

                    {cloudVersion.mjMessage && (
                        <div className="bg-white/60 border border-amber-900/10 p-2 rounded-sm mt-2">
                            <div className="text-[10px] font-black uppercase text-amber-900/40 flex items-center gap-1 mb-1">
                                <MessageSquare size={10} /> Note du Gardien
                            </div>
                            <p className="text-[12px] italic text-stone-700">{cloudVersion.mjMessage}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                <p>
                    Envoyer votre fiche actuelle au Maître de Jeu.
                    Vos données locales restent prioritaires.
                </p>
            </div>

            {/* Campaign Selector */}
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-bold text-[#4a3b32]">
                        Campagne
                    </label>
                    {isOnlineMode && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200 uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                            Verrouillé sur session active
                        </span>
                    )}
                </div>
                {isLoadingCampaigns ? (
                    <div className="text-gray-500 text-sm">Chargement des campagnes...</div>
                ) : campaigns.length === 0 ? (
                    <div className="text-amber-600 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Aucune campagne publique disponible
                    </div>
                ) : (
                    <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        disabled={isOnlineMode}
                        className={`w-full px-3 py-2 border border-[#bfae85] rounded-md bg-white text-[#2c241b] focus:outline-none focus:ring-2 focus:ring-[#8b2e2e] ${isOnlineMode ? 'opacity-70 bg-stone-50 cursor-not-allowed' : ''}`}
                    >
                        {campaigns.map(campaign => (
                            <option key={campaign.id} value={campaign.id}>
                                {campaign.name} (v{campaign.version})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Player Name */}
            <div>
                <label htmlFor="player-name-input" className="block text-sm font-bold text-[#4a3b32] mb-1.5">
                    Nom du Joueur
                </label>
                <input
                    id="player-name-input"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-3 py-2 border border-[#bfae85] rounded-md bg-white text-[#2c241b] focus:outline-none focus:ring-2 focus:ring-[#8b2e2e]"
                />
            </div>

            {/* Character Name */}
            <div>
                <label htmlFor="character-name-input" className="block text-sm font-bold text-[#4a3b32] mb-1.5">
                    Nom du Personnage
                </label>
                <input
                    id="character-name-input"
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Nom du personnage"
                    className="w-full px-3 py-2 border border-[#bfae85] rounded-md bg-white text-[#2c241b] focus:outline-none focus:ring-2 focus:ring-[#8b2e2e]"
                />
            </div>

            {/* Auto-sync Toggle */}
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-md">
                <div>
                    <div className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                        <RefreshCw size={14} className={isAutoSync ? "animate-spin-slow" : ""} />
                        Synchronisation automatique
                    </div>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                        Sauvegarde vers le cloud après chaque modification (délai 10s).
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isAutoSync}
                        onChange={(e) => setIsAutoSync(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-300 rounded-md p-3 text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {errorMessage}
                </div>
            )}

            {/* Success Message */}
            {status === 'success' && (
                <div className="bg-green-50 border border-green-300 rounded-md p-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Fiche synchronisée avec succès !
                </div>
            )}

            {/* Existing Sync Info */}
            {characterData.syncInfo && (
                <div className="text-xs text-gray-500 border-t border-[#bfae85]/30 pt-3 mt-3">
                    Dernière sync : {new Date(characterData.syncInfo.lastSynced || Date.now()).toLocaleString('fr-FR')}
                    <br />
                    Campagne : {characterData.syncInfo.settingName}
                </div>
            )}

            {/* Database Backups History */}
            {characterData.syncInfo?.syncId && (
                <SyncHistoryTab
                    history={history}
                    isLoading={isLoadingHistory}
                    isRestoring={isRestoring}
                    onRestore={onRestore}
                />
            )}
        </div>
    );
};

export default SyncViewTab;
