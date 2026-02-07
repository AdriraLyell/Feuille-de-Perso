/**
 * CloudPanel
 * 
 * Panel for loading character sheets from cloud storage.
 * Allows players to retrieve their synced characters.
 */

import React, { useState } from 'react';
import { Cloud, Download, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { CharacterSyncService, SyncedCharacterSummary } from '../../services/CharacterSyncService';
import { CharacterSheetData } from '../../types/character';
import { PlayerService } from '../../services/PlayerService';

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

        const fullCharacter = await CharacterSyncService.getCharacterById(char.id);

        if (!fullCharacter) {
            setLoadStatus('error');
            setErrorMessage('Échec du chargement du personnage');
            setSelectedCharId(null);
            return;
        }

        // Get campaign name for syncInfo
        const campaigns = await PlayerService.listPublicSettings();
        const campaign = campaigns.find(c => c.id === char.setting_id);

        // Update syncInfo
        const loadedData: CharacterSheetData = {
            ...fullCharacter.data,
            syncInfo: {
                syncId: fullCharacter.id,
                settingId: fullCharacter.setting_id || 'orphan',
                settingName: campaign?.name || (fullCharacter.setting_id ? 'Campagne Inconnue' : 'Indépendant (Archives)'),
                lastSynced: new Date(fullCharacter.last_synced).getTime()
            }
        };

        setLoadStatus('success');

        // Notify parent
        if (onLoadSuccess) {
            onLoadSuccess(loadedData);
        }

        // Close after short delay
        setTimeout(() => {
            onClose();
        }, 1500);
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
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle size={28} className="text-amber-600" />
                            <h3 className="text-xl font-bold text-[#2c241b]">Confirmer le chargement</h3>
                        </div>
                        <p className="text-stone-700 mb-6">
                            Vous avez déjà un personnage local (<strong>{data.header?.name}</strong>).
                            Charger <strong>{pendingLoad.character_name}</strong> écrasera vos données locales.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    setPendingLoad(null);
                                }}
                                className="px-4 py-2 text-[#5c4d41] hover:bg-[#bfae85]/20 rounded-md transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => performLoad(pendingLoad)}
                                className="px-6 py-2 bg-[#8b2e2e] hover:bg-[#a33939] text-white rounded-md font-bold transition-colors"
                            >
                                Écraser et charger
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CloudPanel;
