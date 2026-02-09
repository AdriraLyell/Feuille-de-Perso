import React, { useState, useEffect } from 'react';
import { UploadCloud, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import ThematicModal from './ui/ThematicModal';
import { PlayerService } from '../services/PlayerService';
import { CharacterSyncService } from '../services/CharacterSyncService';
import { CharacterSheetData } from '../types/character';
import { GameSettingSummary } from '../services/CampaignService';
import { useRules } from '../context/RulesContext';
import { ErrorService } from '../services/ErrorService';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterData: CharacterSheetData;
    onSyncComplete: (syncInfo: CharacterSheetData['syncInfo']) => void;
}

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

const SyncModal: React.FC<SyncModalProps> = ({
    isOpen,
    onClose,
    characterData,
    onSyncComplete
}) => {
    const { isOnlineMode, rules } = useRules();
    const [campaigns, setCampaigns] = useState<GameSettingSummary[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [playerName, setPlayerName] = useState<string>('');
    const [characterName, setCharacterName] = useState<string>('');
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [isAutoSync, setIsAutoSync] = useState(false);

    // Pre-fill from existing syncInfo or header
    useEffect(() => {
        if (isOpen) {
            // Priority 1: Current Rules (if online)
            if (isOnlineMode && (rules as any)?.settingId) {
                setSelectedCampaign((rules as any).settingId);
            }
            // Priority 2: Existing sync info (if not online or as fallback)
            else if (characterData.syncInfo) {
                setSelectedCampaign(characterData.syncInfo?.settingId || '');
            }

            // Pre-fill names from header
            setPlayerName(characterData.header?.player || '');
            setCharacterName(characterData.header?.name || '');
            setIsAutoSync(characterData.syncInfo?.isAutoSyncEnabled || false);
            setStatus('idle');
            setErrorMessage('');
        }
    }, [isOpen, characterData, isOnlineMode, rules]);

    // Load public campaigns
    useEffect(() => {
        if (isOpen && campaigns.length === 0) {
            loadCampaigns();
        }
    }, [isOpen]);

    const loadCampaigns = async () => {
        setIsLoadingCampaigns(true);
        try {
            const publicSettings = await PlayerService.listPublicSettings();
            setCampaigns(publicSettings);
            // Auto-select first campaign if none selected
            if (publicSettings.length > 0 && !selectedCampaign) {
                setSelectedCampaign(publicSettings[0].id);
            }
        } catch (e) {
            ErrorService.handleError(e, { context: 'SyncModal.loadCampaigns', userMessage: 'Impossible de charger la liste des campagnes.' });
        } finally {
            setIsLoadingCampaigns(false);
        }
    };

    const handleSync = async () => {
        if (!selectedCampaign || !playerName.trim() || !characterName.trim()) {
            setErrorMessage('Veuillez remplir tous les champs');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        const result = await CharacterSyncService.syncCharacter(
            selectedCampaign,
            playerName.trim(),
            characterName.trim(),
            characterData
        );

        if (result.success && result.syncId) {
            setStatus('success');
            const campaignData = campaigns.find(c => c.id === selectedCampaign);

            // Notify parent with new sync info
            onSyncComplete({
                syncId: result.syncId,
                settingId: selectedCampaign,
                settingName: campaignData?.name || 'Campagne',
                lastSynced: Date.now(),
                isAutoSyncEnabled: isAutoSync
            });

            // Close after short delay to show success
            setTimeout(() => {
                onClose();
            }, 1500);
        } else {
            setStatus('error');
            setErrorMessage(result.error || 'Échec de la synchronisation');
        }
    };

    const canSync = selectedCampaign && playerName.trim() && characterName.trim() && status !== 'loading';

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title="Synchroniser avec le MJ"
            icon={<UploadCloud size={28} />}
            size="sm"
            footer={
                <div className="flex gap-3 w-full justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[#5c4d41] hover:bg-[#bfae85]/20 rounded-md transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={!canSync}
                        className={`px-6 py-2 rounded-md font-bold flex items-center gap-2 transition-all ${canSync
                            ? 'bg-[#2d5a27] hover:bg-[#3d7a37] text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {status === 'loading' ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                <span className="ml-2">Synchronisation...</span>
                            </>
                        ) : status === 'success' ? (
                            <>
                                <CheckCircle size={18} />
                                <span className="ml-2">Synchronisé !</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={18} />
                                <span className="ml-2">Synchroniser</span>
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                    <p>
                        Cette action enverra une copie de votre fiche au MJ de la campagne sélectionnée.
                        Vos données locales ne seront pas modifiées.
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
                    {isOnlineMode && (
                        <p className="mt-1.5 text-[11px] text-stone-500 italic">
                            Les règles appliquées dépendent de cette campagne. Vous ne pouvez pas synchroniser sur une autre source sans recharger l'application.
                        </p>
                    )}
                </div>

                {/* Player Name */}
                <div>
                    <label className="block text-sm font-bold text-[#4a3b32] mb-1.5">
                        Nom du Joueur
                    </label>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Votre nom"
                        className="w-full px-3 py-2 border border-[#bfae85] rounded-md bg-white text-[#2c241b] focus:outline-none focus:ring-2 focus:ring-[#8b2e2e]"
                    />
                </div>

                {/* Character Name */}
                <div>
                    <label className="block text-sm font-bold text-[#4a3b32] mb-1.5">
                        Nom du Personnage
                    </label>
                    <input
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
            </div>
        </ThematicModal>
    );
};

export default SyncModal;
