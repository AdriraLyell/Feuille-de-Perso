/**
 * CampaignCharactersView
 * 
 * Lists all synced character sheets for a campaign (Admin view).
 */

import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, User, Clock, Eye } from 'lucide-react';
import { CharacterSyncService, SyncedCharacter, SyncedCharacterSummary } from '../../services/CharacterSyncService';
import CharacterReadOnlyView from './CharacterReadOnlyView';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { MotionCard } from '../../components/ui/motion/MotionCard';
import { ErrorService } from '../../services/ErrorService';
import { RotateCcw } from 'lucide-react';
import RecreationModal from './RecreationModal';
import { RecreationService } from '../services/RecreationService';
import { CampaignService } from '../../services/CampaignService';

interface CampaignCharactersViewProps {
    settingId: string;
    onRefreshRules?: () => void;
}

const CampaignCharactersView: React.FC<CampaignCharactersViewProps> = ({ settingId, onRefreshRules }) => {
    const [characters, setCharacters] = useState<SyncedCharacterSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState<SyncedCharacter | null>(null);
    const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
    const [characterToRecreate, setCharacterToRecreate] = useState<SyncedCharacter | null>(null);
    const [isRecreating, setIsRecreating] = useState(false);

    useEffect(() => {
        loadCharacters();
    }, [settingId]);

    const loadCharacters = async () => {
        setIsLoading(true);
        try {
            const data = await CharacterSyncService.getCharactersBySettingId(settingId);
            setCharacters(data);
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'CampaignCharactersView.loadCharacters',
                userMessage: 'Impossible de charger les fiches de personnages.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatSize = (bytes: number | undefined) => {
        if (bytes === undefined) return '-';
        if (bytes < 1024) return `${bytes} o`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ko`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    };

    const handleViewCharacter = async (id: string) => {
        setIsLoadingCharacter(true);
        try {
            const character = await CharacterSyncService.getCharacterById(id);
            if (character) {
                setSelectedCharacter(character);
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'CampaignCharactersView.handleViewCharacter',
                userMessage: 'Erreur lors de la récupération des détails du personnage.'
            });
        } finally {
            setIsLoadingCharacter(false);
        }
    };

    const handleRecreateRequest = async (id: string) => {
        try {
            const fullChar = await CharacterSyncService.getCharacterById(id);
            if (fullChar) {
                setCharacterToRecreate(fullChar);
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'CampaignCharactersView.handleRecreateRequest',
                userMessage: "Impossible de préparer la recréation."
            });
        }
    };

    const confirmRecreate = async (refundAmount: number, fullReset: boolean) => {
        if (!characterToRecreate) return;
        setIsRecreating(true);
        try {
            // 1. Charger les règles actuelles de la campagne
            const currentRules = await CampaignService.loadSetting(settingId);
            if (!currentRules) throw new Error("Impossible de charger les règles de la campagne.");

            // 2. Transformer les données
            const newData = RecreationService.performRecreation(characterToRecreate.data, refundAmount, currentRules, fullReset);

            // 3. Persister dans Supabase
            const success = await CharacterSyncService.updateCharacterData(characterToRecreate.id, newData);

            if (success) {
                // Notifier le joueur via un message forcé
                await CharacterSyncService.requestForceUpdate(characterToRecreate.id, "Votre personnage a été réinitialisé par le MJ pour une recréation.");

                // Rafraîchir la liste locale
                await loadCharacters();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'CampaignCharactersView.confirmRecreate',
                userMessage: "Échec de la recréation."
            });
        } finally {
            setIsRecreating(false);
            setCharacterToRecreate(null);
        }
    };

    return (
        <MotionCard className="p-8 border-stone-700/50 h-[calc(100vh-120px)] flex flex-col" hoverEffect="glow">
            <div className="flex justify-between items-center mb-8 border-b border-stone-800 pb-4">
                <div>
                    <h2 className="text-2xl font-serif font-black text-amber-500 flex items-center gap-3 uppercase tracking-widest">
                        <Users className="text-amber-600" />
                        Fiches des Destins
                    </h2>
                    <p className="text-stone-500 font-bold text-[10px] uppercase tracking-widest mt-1">
                        Personnages synchronisés dans cette chronique
                    </p>
                </div>
                <div className="flex items-center gap-2">

                    <button
                        onClick={loadCharacters}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-500 rounded-sm font-bold transition-all border border-stone-800 hover:border-amber-900/30 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        <span className="text-xs uppercase tracking-wider">Rafraîchir</span>
                    </button>
                </div>
            </div>

            {isLoading && characters.length === 0 ? (
                <div className="text-center py-24 text-stone-600">
                    <RefreshCw size={48} className="animate-spin mx-auto mb-4 opacity-20" />
                    <p className="font-serif italic text-lg">Consultation des registres...</p>
                </div>
            ) : characters.length === 0 ? (
                <MotionFade>
                    <div className="text-center py-16 bg-stone-950/30 rounded-sm border-2 border-dashed border-stone-800/50">
                        <Users size={48} className="mx-auto text-stone-800 mb-4" />
                        <p className="text-stone-400 font-serif text-lg italic tracking-wide">Aucune âme n'est encore inscrite ici.</p>
                        <p className="text-stone-600 text-[10px] font-bold uppercase tracking-widest mt-4 max-w-xs mx-auto">
                            Les joueurs doivent synchroniser leur fiche depuis leur interface.
                        </p>
                    </div>
                </MotionFade>
            ) : (
                <div className="flex-grow overflow-y-auto rounded-sm border border-stone-800 bg-stone-900/40 custom-scrollbar">
                    <table className="w-full">
                        <thead className="bg-stone-950/50">
                            <tr>
                                <th className="text-left px-6 py-4 font-bold text-amber-900 text-[10px] uppercase tracking-widest border-b border-stone-800">
                                    Personnage
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-amber-900 text-[10px] uppercase tracking-widest border-b border-stone-800">
                                    Joueur
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-amber-900 text-[10px] uppercase tracking-widest border-b border-stone-800">
                                    Dernier Passage
                                </th>
                                <th className="text-center px-6 py-4 font-bold text-amber-900 text-[10px] uppercase tracking-widest border-b border-stone-800">
                                    Taille
                                </th>
                                <th className="text-right px-6 py-4 font-bold text-amber-900 text-[10px] uppercase tracking-widest border-b border-stone-800">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/50">
                            {characters.map((char, index) => (
                                <MotionFade
                                    key={char.id}
                                    delay={index * 0.05}
                                    tag="tr"
                                    className="hover:bg-stone-800/20 transition-colors group cursor-default"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-900/20 border border-amber-900/30 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                <User size={20} className="text-amber-600" />
                                            </div>
                                            <span className="font-serif font-bold text-xl text-stone-200 group-hover:text-amber-500 transition-colors">{char.character_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-stone-400 font-medium tracking-wide">{char.player_name}</span>
                                    </td>
                                    <td className="px-6 py-5 text-stone-500 text-xs">
                                        <div className="flex items-center gap-2 font-mono">
                                            <Clock size={14} className="text-stone-700" />
                                            {new Date(char.last_synced).toLocaleString('fr-FR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-stone-500 text-xs text-center">
                                        <div className="font-mono text-[10px] text-stone-600">
                                            {formatSize(char.data_size)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                            onClick={() => handleViewCharacter(char.id)}
                                            disabled={isLoadingCharacter}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/20 hover:bg-amber-700 text-amber-500 hover:text-stone-900 rounded-sm font-bold text-xs transition-all border border-amber-900/30 shadow-sm active:scale-95"
                                        >
                                            <Eye size={16} />
                                            <span className="uppercase tracking-widest">Voir</span>
                                        </button>
                                        <button
                                            onClick={() => handleRecreateRequest(char.id)}
                                            disabled={isRecreating || isLoadingCharacter}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-stone-900/60 hover:bg-amber-600/20 text-stone-500 hover:text-amber-500 rounded-sm font-bold text-xs transition-all border border-stone-800 hover:border-amber-900/30 shadow-sm active:scale-95 uppercase tracking-widest disabled:opacity-50"
                                            title="Lancer une recréation (Respec)"
                                        >
                                            <RotateCcw size={14} className={isRecreating && characterToRecreate?.id === char.id ? 'animate-spin' : ''} />
                                            Recréer
                                        </button>
                                    </td>
                                </MotionFade>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Character Detail Modal */}
            {selectedCharacter && (
                <CharacterReadOnlyView
                    character={selectedCharacter}
                    onClose={() => setSelectedCharacter(null)}
                    onRefreshRules={onRefreshRules}
                    allowForceUpdate={true}
                />
            )}

            {/* Recreation Modal */}
            {characterToRecreate && (
                <RecreationModal
                    isOpen={!!characterToRecreate}
                    onClose={() => setCharacterToRecreate(null)}
                    onConfirm={confirmRecreate}
                    character={characterToRecreate.data}
                />
            )}

        </MotionCard>
    );
};

export default CampaignCharactersView;
