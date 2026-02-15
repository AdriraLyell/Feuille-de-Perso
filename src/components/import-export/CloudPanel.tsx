/**
 * CloudPanel
 * 
 * Panel for loading character sheets from cloud storage.
 * Allows players to retrieve their synced characters.
 */

import React, { useState } from 'react';
import { Cloud, Download, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { CharacterSyncService, SyncedCharacterSummary } from '../../services/CharacterSyncService';
import { ImageSyncResolver } from '../../services/ImageSyncResolver';
import { CharacterSheetData } from '../../types/character';
import { CampaignService } from '../../services/CampaignService';
import { detectConflicts, smartMerge, DataConflict } from '../../utils/importExportUtils';
import CloudConflictResolver from './CloudConflictResolver';
import { ErrorService } from '../../services/ErrorService';
import { logger } from '../../utils/logger';
import ThematicModal from '../ui/ThematicModal';
import ThematicButton from '../ui/ThematicButton';
import { useNotification } from '../../context/NotificationContext';

interface CloudPanelProps {
    data: CharacterSheetData;
    onLoadSuccess?: (newData: CharacterSheetData) => void;
    onClose: () => void;
}

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

const CloudPanel: React.FC<CloudPanelProps> = ({ data, onLoadSuccess, onClose }) => {
    const [playerName, setPlayerName] = useState(data.header?.player || '');
    const [characters, setCharacters] = useState<SyncedCharacterSummary[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingLoad, setPendingLoad] = useState<SyncedCharacterSummary | null>(null);
    const [pendingData, setPendingData] = useState<CharacterSheetData | null>(null);

    // Conflict Resolution State
    const [conflicts, setConflicts] = useState<DataConflict[]>([]);
    const [resolutionMap, setResolutionMap] = useState<Record<string, 'keep_current' | 'replace'>>({});
    const [isResolvingConflicts, setIsResolvingConflicts] = useState(false);

    const addLog = useNotification();

    const handleSearch = async () => {
        if (!playerName.trim()) {
            setErrorMessage('Veuillez saisir un nom de joueur');
            return;
        }

        setIsSearching(true);
        setErrorMessage('');
        setCharacters([]);

        const results = await CharacterSyncService.getCharactersByPlayerName(playerName);
        setCharacters(results);
        setIsSearching(false);

        if (results.length === 0) {
            setErrorMessage('Aucun personnage trouvé pour ce joueur');
        }
    };

    const handleLoadCharacter = async (char: SyncedCharacterSummary) => {
        // Check if local character exists
        if (data.header?.name && data.header.name.trim() !== '') {
            // Show confirmation modal
            setPendingLoad(char);
            setShowConfirm(true);
            return;
        }

        // No local character, load directly
        await performLoad(char);
    };

    const performLoad = async (char: SyncedCharacterSummary) => {
        setLoadStatus('loading');
        setSelectedCharId(char.id);
        setErrorMessage('');
        setShowConfirm(false);

        try {
            const fullCharacter = await CharacterSyncService.getCharacterById(char.id);

            if (!fullCharacter) {
                setLoadStatus('error');
                setErrorMessage('Échec du chargement du personnage');
                setSelectedCharId(null);
                return;
            }

            // Step 1: Restore images from cloud format to local IndexedDB
            fullCharacter.data = await ImageSyncResolver.injectImagesAfterSync(fullCharacter.data) as CharacterSheetData;

            const incomingData = fullCharacter.data;

            // Step 2: 3-Way Check (Dirty Check)
            const isLocalLinked = data.syncInfo?.syncId === char.id;
            const currentHash = CharacterSyncService.generateDataHash(data);
            const lastSyncedHash = data.syncInfo?.lastSyncedHash;
            const isLocalDirty = isLocalLinked && lastSyncedHash && currentHash !== lastSyncedHash;

            if (isLocalDirty && !isResolvingConflicts) {
                logger.info("Local character is dirty, forcing conflict resolver", { currentHash, lastSyncedHash });
                setConflicts([{
                    type: 'skill', // Fake conflict to trigger resolver
                    key: 'force_conflict_root',
                    name: 'Données Personnelles',
                    current: { name: 'Version Locale (Modifiée)', description: 'Vos changements non synchronisés' } as any,
                    incoming: { name: 'Version Cloud', description: 'Version du Gardien / Dernier backup' } as any
                }]);
                setPendingData(incomingData);
                setIsResolvingConflicts(true);
                setLoadStatus('idle');
                return;
            }

            // Step 3: Standard Library Conflict Detection
            if (data.header?.name && data.header.name.trim() !== '' && !isResolvingConflicts) {
                const detected = detectConflicts(
                    data.skillLibrary || [], incomingData.skillLibrary || [],
                    data.library || [], incomingData.library || [],
                    data.specializationLibrary || [], incomingData.specializationLibrary || []
                );

                if (detected.length > 0) {
                    setConflicts(detected);
                    const initialMap: Record<string, 'keep_current' | 'replace'> = {};
                    detected.forEach(c => initialMap[c.key] = 'keep_current');
                    setResolutionMap(initialMap);
                    setPendingData(incomingData);
                    setIsResolvingConflicts(true);
                    setLoadStatus('idle');
                    return;
                }
            }

            // Get campaign name for syncInfo
            const campaigns = await CampaignService.listPublicSettings();
            const campaign = campaigns.find(c => c.id === char.setting_id);

            // Update syncInfo
            const loadedData: CharacterSheetData = {
                ...incomingData,
                syncInfo: {
                    syncId: fullCharacter.id,
                    settingId: fullCharacter.setting_id || 'orphan',
                    settingName: campaign?.name || (fullCharacter.setting_id ? 'Campagne Inconnue' : 'Indépendant (Archives)'),
                    lastSynced: new Date(fullCharacter.last_synced).getTime(),
                    lastSyncedHash: CharacterSyncService.generateDataHash(incomingData),
                    mjMessage: incomingData.syncInfo?.mjMessage // Carry over any MJ message
                }
            };

            setLoadStatus('success');
            if (onLoadSuccess) onLoadSuccess(loadedData);
            setTimeout(() => onClose(), 1500);

        } catch (error) {
            ErrorService.handleError(error, { context: 'CloudPanel.performLoad', userMessage: "Erreur lors du chargement." });
            setLoadStatus('error');
            setErrorMessage('Erreur technique lors du chargement');
        }
    };

    const handleConfirmMerge = () => {
        if (!pendingData || !pendingLoad) return;

        try {
            const mergedSkills = smartMerge(data.skillLibrary || [], pendingData.skillLibrary || [], resolutionMap, 'skill');
            const mergedTraits = smartMerge(data.library || [], pendingData.library || [], resolutionMap, 'trait');
            const mergedSpecs = smartMerge(data.specializationLibrary || [], pendingData.specializationLibrary || [], resolutionMap, 'specialization');

            const finalData: CharacterSheetData = {
                ...pendingData,
                skillLibrary: mergedSkills,
                library: mergedTraits,
                specializationLibrary: mergedSpecs,
                syncInfo: {
                    syncId: pendingLoad.id,
                    settingId: pendingLoad.setting_id || 'orphan',
                    settingName: 'Fusion Cloud', // Simplification or fetch campaign name
                    lastSynced: Date.now()
                }
            };

            setLoadStatus('success');
            if (onLoadSuccess) onLoadSuccess(finalData);
            addLog("Synchronisation et fusion réussies.", 'success', 'both');
            onClose();
        } catch (error) {
            ErrorService.handleError(error, { context: 'CloudPanel.handleConfirmMerge' });
            addLog("Erreur lors de la fusion.", 'danger', 'both');
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                <p>
                    Chargez un personnage précédemment synchronisé depuis le cloud.
                    Saisissez votre nom de joueur pour voir vos personnages.
                </p>
            </div>

            {/* Search Section */}
            <div className="flex gap-3">
                <div className="flex-grow">
                    <label className="block text-sm font-bold text-[#4a3b32] mb-1.5">
                        Nom du Joueur
                    </label>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Votre nom"
                        className="w-full px-3 py-2 border border-[#bfae85] rounded-md bg-white text-[#2c241b] focus:outline-none focus:ring-2 focus:ring-[#8b2e2e]"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || !playerName.trim()}
                        className={`px-6 py-2 rounded-md font-bold flex items-center gap-2 transition-all ${isSearching || !playerName.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#2d5a27] hover:bg-[#3d7a37] text-white'
                            }`}
                    >
                        {isSearching ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Recherche...
                            </>
                        ) : (
                            <>
                                <Cloud size={18} />
                                Rechercher
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-300 rounded-md p-3 text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {errorMessage}
                </div>
            )}

            {/* Characters List */}
            {characters.length > 0 && (
                <div className="border border-[#bfae85] rounded-md overflow-hidden">
                    <div className="bg-[#8b2e2e] text-white px-4 py-2 font-bold flex items-center gap-2">
                        <Cloud size={18} />
                        Personnages trouvés ({characters.length})
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {characters.map((char) => (
                            <div
                                key={char.id}
                                className="border-b border-[#bfae85]/30 last:border-b-0 p-4 hover:bg-[#bfae85]/10 transition-colors"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-grow">
                                        <div className="font-bold text-[#2c241b]">
                                            {char.character_name}
                                        </div>
                                        <div className="text-sm text-stone-600">
                                            Dernière sync : {new Date(char.last_synced).toLocaleString('fr-FR')}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleLoadCharacter(char)}
                                        disabled={loadStatus === 'loading'}
                                        className={`px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all ${selectedCharId === char.id && loadStatus === 'loading'
                                            ? 'bg-gray-300 text-gray-500'
                                            : selectedCharId === char.id && loadStatus === 'success'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-[#2d5a27] hover:bg-[#3d7a37] text-white'
                                            }`}
                                    >
                                        {selectedCharId === char.id && loadStatus === 'loading' ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Chargement...
                                            </>
                                        ) : selectedCharId === char.id && loadStatus === 'success' ? (
                                            <>
                                                <CheckCircle size={16} />
                                                Chargé !
                                            </>
                                        ) : (
                                            <>
                                                <Download size={16} />
                                                Charger
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && pendingLoad && (
                <ThematicModal
                    isOpen={showConfirm}
                    onClose={() => { setShowConfirm(false); setPendingLoad(null); }}
                    title="Confirmer le chargement"
                    scheme="mystic"
                >
                    <div className="p-4">
                        <p className="text-stone-300 mb-6">
                            Vous avez déjà un personnage local (<strong>{data.header?.name}</strong>).
                            Voulez-vous fusionner les données ou tout écraser ?
                        </p>
                        <div className="flex flex-col gap-3">
                            <ThematicButton
                                variant="primary"
                                onClick={() => performLoad(pendingLoad)}
                            >
                                Charger (Vérifier les conflits de bibliothèque)
                            </ThematicButton>
                            <ThematicButton
                                variant="secondary"
                                onClick={() => {
                                    // Hack: simulate no conflicts to force overwrite or add separate logic
                                    // For now, performLoad will naturally detect conflicts if name exists.
                                    performLoad(pendingLoad);
                                }}
                            >
                                Écraser tout
                            </ThematicButton>
                        </div>
                    </div>
                </ThematicModal>
            )}

            {/* Conflict Resolver Overlay */}
            {isResolvingConflicts && (
                <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-stone-950 w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-amber-900/30">
                        <CloudConflictResolver
                            conflicts={conflicts}
                            resolutionMap={resolutionMap}
                            onResolutionChoice={(key, choice) => setResolutionMap(prev => ({ ...prev, [key]: choice }))}
                            onResolveAll={(choice) => {
                                const newMap: Record<string, 'keep_current' | 'replace'> = {};
                                conflicts.forEach(c => newMap[c.key] = choice);
                                setResolutionMap(newMap);
                            }}
                            onCancel={() => setIsResolvingConflicts(false)}
                            onConfirm={handleConfirmMerge}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CloudPanel;
