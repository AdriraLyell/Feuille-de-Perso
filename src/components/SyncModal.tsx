import React, { useState, useEffect } from 'react';
import { UploadCloud, AlertTriangle, CheckCircle, RefreshCw, MessageSquare, History, RotateCcw } from 'lucide-react';
import ThematicModal from './ui/ThematicModal';
import { CharacterSyncService, CharacterHistoryEntry } from '../services/CharacterSyncService';
import { CharacterSheetData } from '../types/character';
import { GameSettingSummary, CampaignService } from '../services/CampaignService';
import { useRules } from '../context/RulesContext';
import { ErrorService } from '../services/ErrorService';
import { logger } from '../utils/logger';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterData: CharacterSheetData;
    onSyncComplete: (syncInfo: CharacterSheetData['syncInfo']) => void;
    onRestore?: (data: CharacterSheetData) => void;
}

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

const SyncModal: React.FC<SyncModalProps> = ({
    isOpen,
    onClose,
    characterData,
    onSyncComplete,
    onRestore
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
    const [cloudVersion, setCloudVersion] = useState<{ lastSynced: number, mjMessage?: string } | null>(null);
    const [history, setHistory] = useState<CharacterHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const loadHistory = async (syncId: string) => {
        setIsLoadingHistory(true);
        try {
            const versions = await CharacterSyncService.getCharacterHistory(syncId);
            setHistory(versions);
        } catch (e) {
            logger.error("Failed to load history", e);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleRestore = async (entry: CharacterHistoryEntry) => {
        if (!onRestore) return;

        setIsRestoring(true);
        try {
            // Decrypt/Inject images for UI
            const restoredData = await CharacterSyncService.processImages(entry.data, 'decompress');
            onRestore(restoredData);
            onClose();
        } catch (e) {
            logger.error("Restoration failed", e);
            setErrorMessage("Erreur lors de la restauration.");
        } finally {
            setIsRestoring(false);
        }
    };

    // Pre-fill from existing syncInfo or header
    useEffect(() => {
        if (isOpen) {
            // Priority 1: Current Rules (if online)
            if (isOnlineMode && rules?.settingId) {
                setSelectedCampaign(rules.settingId);
            }
            // Priority 2: Existing sync info (if not online or as fallback)
            else if (characterData.syncInfo) {
                setSelectedCampaign(characterData.syncInfo?.settingId || '');
            }

            // Pre-fill names from header
            setPlayerName(characterData.header?.player || '');
            setCharacterName(characterData.header?.name || '');
            setIsAutoSync(characterData.syncInfo?.isAutoSyncEnabled || false);
            setErrorMessage('');

            // Check if a newer version exists on cloud
            if (characterData.syncInfo?.syncId) {
                checkCloudVersion(characterData.syncInfo.syncId);
                loadHistory(characterData.syncInfo.syncId);
            }
        } else {
            setCloudVersion(null);
            setHistory([]);
        }
    }, [isOpen, characterData, isOnlineMode, rules]);

    const checkCloudVersion = async (syncId: string) => {
        try {
            const char = await CharacterSyncService.getCharacterById(syncId);
            if (char) {
                setCloudVersion({
                    lastSynced: new Date(char.last_synced).getTime(),
                    mjMessage: char.data.syncInfo?.mjMessage
                });
            }
        } catch (e) {
            logger.error("Failed to check cloud version", e);
        }
    };

    // Load public campaigns
    useEffect(() => {
        if (isOpen && campaigns.length === 0) {
            loadCampaigns();
        }
    }, [isOpen]);

    const loadCampaigns = async () => {
        setIsLoadingCampaigns(true);
        try {
            const publicSettings = await CampaignService.listPublicSettings();
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
                lastSyncedHash: result.hash,
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
                {/* Cloud Update Status Indicator */}
                {cloudVersion && characterData.syncInfo && cloudVersion.lastSynced > (characterData.syncInfo.lastSynced || 0) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                            <AlertTriangle size={18} className="text-amber-600" />
                            Mise à jour disponible sur le Cloud
                        </div>
                        <p className="text-xs text-amber-700 leading-relaxed mb-2">
                            Le Gardien ou un autre dispositif a synchronisé une version plus récente ({new Date(cloudVersion.lastSynced).toLocaleString()}).
                            Il est recommandé de <strong>charger</strong> cette version via le panneau Cloud avant d'envoyer vos modifications.
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
                    <div className="mt-6 border-t border-[#bfae85]/50 pt-5">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#4a3b32] mb-3">
                            <History size={18} className="text-[#8b2e2e]" />
                            Historique des sauvegardes (Cloud)
                        </div>

                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center py-4 text-stone-400">
                                <RefreshCw size={20} className="animate-spin" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="bg-stone-50 border border-dashed border-stone-200 rounded p-4 text-center text-xs text-stone-500 italic">
                                Aucun historique disponible pour ce personnage.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {history.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-md hover:border-[#bfae85] transition-colors group">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-stone-700">
                                                {new Date(entry.archived_at).toLocaleString('fr-FR')}
                                            </span>
                                            <span className={`text-[10px] uppercase font-black ${entry.version_reason === 'manual' ? 'text-blue-600' : 'text-amber-600'}`}>
                                                {entry.version_reason === 'manual' ? 'Sauvegarde manuelle' : 'Auto-save (1h)'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRestore(entry)}
                                            disabled={isRestoring}
                                            className="px-3 py-1.5 bg-stone-100 hover:bg-[#8b2e2e] hover:text-white text-[#8b2e2e] text-xs font-bold rounded flex items-center gap-1.5 transition-all disabled:opacity-50"
                                        >
                                            <RotateCcw size={12} />
                                            Restaurer
                                        </button>
                                    </div>
                                ))}
                                <p className="text-[10px] text-stone-400 italic mt-2 text-center">
                                    Seules les 2 dernières versions sont conservées.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ThematicModal>
    );
};

export default SyncModal;
