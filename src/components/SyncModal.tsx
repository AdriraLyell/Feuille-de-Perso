import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, Cloud, Wifi } from 'lucide-react';
import ThematicModal from './ui/ThematicModal';
import { CharacterSyncService, CharacterHistoryEntry } from '../services/CharacterSyncService';
import { CharacterSheetData } from '../types/character';
import { GameSettingSummary, CampaignService } from '../services/CampaignService';
import { useRules } from '../context/RulesContext';
import { ErrorService } from '../services/ErrorService';
import { logger } from '../utils/logger';
import CloudPanel from './import-export/CloudPanel';
import { APP_VERSION } from '../constants/app';
import SyncViewTab from './sync/parts/SyncViewTab';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterData: CharacterSheetData;
    onSyncComplete: (syncInfo: CharacterSheetData['syncInfo']) => void;
    onRestore?: (data: CharacterSheetData) => void;
}

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';
type Tab = 'sync' | 'library';

const SyncModal: React.FC<SyncModalProps> = ({
    isOpen,
    onClose,
    characterData,
    onSyncComplete,
    onRestore
}) => {
    const { isOnlineMode, rules } = useRules();
    const [activeTab, setActiveTab] = useState<Tab>('sync');

    // Sync Tab State
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

    useEffect(() => {
        if (isOpen) {
            if (isOnlineMode && rules?.settingId) {
                setSelectedCampaign(rules.settingId);
            }
            else if (characterData.syncInfo) {
                setSelectedCampaign(characterData.syncInfo?.settingId || '');
            }

            setPlayerName(characterData.header?.player || '');
            setCharacterName(characterData.header?.name || '');
            setIsAutoSync(characterData.syncInfo?.isAutoSyncEnabled || false);
            setErrorMessage('');

            if (characterData.syncInfo?.syncId) {
                checkCloudVersion(characterData.syncInfo.syncId);
                loadHistory(characterData.syncInfo.syncId);
            }
        } else {
            setCloudVersion(null);
            setHistory([]);
            setActiveTab('sync');
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

    useEffect(() => {
        if (isOpen && campaigns.length === 0 && activeTab === 'sync') {
            loadCampaigns();
        }
    }, [isOpen, activeTab]);

    const loadCampaigns = async () => {
        setIsLoadingCampaigns(true);
        try {
            const publicSettings = await CampaignService.listPublicSettings();
            setCampaigns(publicSettings);
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

            onSyncComplete({
                syncId: result.syncId,
                settingId: selectedCampaign,
                settingName: campaignData?.name || 'Campagne',
                lastSynced: Date.now(),
                lastSyncedHash: result.hash,
                isAutoSyncEnabled: isAutoSync
            });

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
            title={activeTab === 'sync' ? "Synchronisation (Push)" : "Bibliothèque Cloud (Pull)"}
            icon={<UploadCloud size={28} />}
            size="lg"
            footer={
                <div className="flex justify-between items-center w-full">
                    <span className="text-xs text-stone-500">v{APP_VERSION}</span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-[#5c4d41] hover:bg-[#bfae85]/20 rounded-md transition-colors"
                        >
                            Fermer
                        </button>
                        {activeTab === 'sync' && (
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
                        )}
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-[600px] gap-4">
                {/* Tabs */}
                <div className="flex gap-2 border-b-2 border-[#bfae85]/50 pb-0 shrink-0">
                    <button
                        onClick={() => setActiveTab('sync')}
                        className={`px-4 py-2 font-serif font-bold text-sm transition-colors rounded-t-lg border-t border-l border-r ${activeTab === 'sync'
                            ? 'bg-[#8b2e2e] text-[#fdfbf7] border-[#8b2e2e]'
                            : 'bg-transparent text-[#5c4d41] hover:bg-[#bfae85]/20 border-transparent'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Wifi size={16} />
                            Synchronisation
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`px-4 py-2 font-serif font-bold text-sm transition-colors rounded-t-lg border-t border-l border-r ${activeTab === 'library'
                            ? 'bg-[#8b2e2e] text-[#fdfbf7] border-[#8b2e2e]'
                            : 'bg-transparent text-[#5c4d41] hover:bg-[#bfae85]/20 border-transparent'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Cloud size={16} />
                            Bibliothèque Cloud
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-hidden">
                    {activeTab === 'library' ? (
                        <CloudPanel
                            data={characterData}
                            onLoadSuccess={onRestore}
                            onClose={onClose}
                        />
                    ) : (
                        <SyncViewTab
                            characterData={characterData}
                            campaigns={campaigns}
                            selectedCampaign={selectedCampaign}
                            setSelectedCampaign={setSelectedCampaign}
                            playerName={playerName}
                            setPlayerName={setPlayerName}
                            characterName={characterName}
                            setCharacterName={setCharacterName}
                            isAutoSync={isAutoSync}
                            setIsAutoSync={setIsAutoSync}
                            status={status}
                            errorMessage={errorMessage}
                            isLoadingCampaigns={isLoadingCampaigns}
                            isOnlineMode={isOnlineMode}
                            cloudVersion={cloudVersion}
                            history={history}
                            isLoadingHistory={isLoadingHistory}
                            isRestoring={isRestoring}
                            onRestore={handleRestore}
                        />
                    )}
                </div>
            </div>
        </ThematicModal>
    );
};

export default SyncModal;
