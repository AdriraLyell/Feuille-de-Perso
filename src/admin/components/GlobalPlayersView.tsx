/**
 * GlobalPlayersView
 * 
 * Admin view to list ALL synchronized characters across all campaigns.
 * Useful for finding "orphaned" characters or tracking player activity globally.
 */

import React, { useState, useEffect } from 'react';
import { Users, Search, Eye, Trash2, Calendar, Shield, AlertCircle, Loader2, User, Clock, RefreshCw } from 'lucide-react';
import { CharacterSyncService, SyncedCharacterSummary, SyncedCharacter } from '../../services/CharacterSyncService';
import CharacterReadOnlyView from './CharacterReadOnlyView';
import { GameSettingSummary, CampaignService } from '../../services/CampaignService';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { MotionCard } from '../../components/ui/motion/MotionCard';

import { ErrorService } from '../../services/ErrorService';

const GlobalPlayersView: React.FC = () => {
    const [characters, setCharacters] = useState<SyncedCharacterSummary[]>([]);
    const [campaigns, setCampaigns] = useState<GameSettingSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCharacter, setSelectedCharacter] = useState<SyncedCharacter | null>(null);
    const [filterOrphans, setFilterOrphans] = useState(false);
    const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [charData, campaignData] = await Promise.all([
                CharacterSyncService.getAllCharacters(),
                CampaignService.listPublicSettings()
            ]);
            setCharacters(charData);
            setCampaigns(campaignData);
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'GlobalPlayersView.loadData',
                userMessage: "Échec du chargement de la base de données joueurs."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getCampaignName = (settingId: string | null) => {
        if (!settingId) return <span className="text-amber-600 font-bold flex items-center gap-1"><AlertCircle size={10} /> Orphelin</span>;
        const campaign = campaigns.find(c => c.id === settingId);
        return campaign ? campaign.name : <span className="text-stone-600 italic">Inconnue</span>;
    };

    const formatSize = (bytes: number | undefined) => {
        if (bytes === undefined) return '-';
        if (bytes < 1024) return `${bytes} o`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ko`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    };

    const handleViewDetails = async (id: string) => {
        try {
            const fullChar = await CharacterSyncService.getCharacterById(id);
            if (fullChar) {
                setSelectedCharacter(fullChar);
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'GlobalPlayersView.handleViewDetails',
                userMessage: "Impossible d'afficher les détails du personnage."
            });
        }
    };

    const handleDelete = (id: string) => {
        setCharacterToDelete(id);
    };

    const confirmDelete = async () => {
        if (!characterToDelete) return;
        try {
            const success = await CharacterSyncService.deleteCharacter(characterToDelete);
            if (success) {
                setCharacters(prev => prev.filter(c => c.id !== characterToDelete));
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'GlobalPlayersView.confirmDelete',
                userMessage: "Échec de la suppression."
            });
        } finally {
            setCharacterToDelete(null);
        }
    };

    const filteredCharacters = characters.filter(char => {
        const matchesSearch =
            char.character_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.player_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesOrphan = filterOrphans ? !char.setting_id : true;

        return matchesSearch && matchesOrphan;
    });

    return (
        <MotionCard className="p-8 border-stone-700/50 h-[calc(100vh-160px)] flex flex-col" hoverEffect="glow">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-stone-800 pb-6">
                <div>
                    <h2 className="text-2xl font-serif font-black text-amber-500 flex items-center gap-3 uppercase tracking-widest">
                        <Users className="text-amber-600" />
                        Registres des Destins
                    </h2>
                    <p className="text-stone-500 font-bold text-[10px] uppercase tracking-widest mt-1">
                        Tous les personnages synchronisés dans l'Éther
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-grow md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={16} />
                        <input
                            type="text"
                            placeholder="RECHERCHER UNE ÂME OU UN GARDIEN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-stone-950/50 border border-stone-800 rounded-sm focus:border-amber-900/50 outline-none text-[11px] font-bold tracking-widest text-stone-200 placeholder-stone-700 transition-all shadow-inner uppercase"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilterOrphans(!filterOrphans)}
                            className={`px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${filterOrphans
                                ? 'bg-amber-900/30 text-amber-500 border-amber-900/50 shadow-glow-amber'
                                : 'bg-stone-900/40 text-stone-500 border-stone-800 hover:text-stone-300 hover:border-stone-700'
                                }`}
                            title="Filtrer les orphelins"
                        >
                            <AlertCircle size={14} />
                            Orphelins
                        </button>

                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900/40 hover:bg-stone-800 text-amber-500 rounded-sm font-bold transition-all border border-stone-800 hover:border-amber-900/30 shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span className="text-[10px] uppercase tracking-widest">Rafraîchir</span>
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && filteredCharacters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-stone-500 flex-grow">
                    <RefreshCw className="animate-spin mb-4 text-amber-900/40" size={48} />
                    <p className="font-serif italic text-lg tracking-wide">Consultation des archives éthérées...</p>
                </div>
            ) : filteredCharacters.length === 0 ? (
                <MotionFade className="flex flex-col items-center justify-center py-24 bg-stone-950/30 rounded-sm border-2 border-dashed border-stone-800/50 flex-grow">
                    <Users className="mb-4 opacity-10 text-stone-600" size={64} />
                    <p className="text-xl font-serif italic text-stone-400">Le vide s'étend devant vous...</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-4 text-stone-600">Aucune âme ne correspond à votre recherche.</p>
                </MotionFade>
            ) : (
                <div className="flex-grow overflow-y-auto rounded-sm border border-stone-800 bg-stone-900/40 custom-scrollbar">
                    <table className="w-full">
                        <thead className="bg-stone-950/50 sticky top-0 z-10">
                            <tr>
                                <th className="text-left px-6 py-4 font-bold text-amber-900 text-[10px] uppercase tracking-widest border-b border-stone-800">
                                    Personnage
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-amber-900 text-[10px] uppercase tracking-widest border-b border-stone-800">
                                    Joueur
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-amber-900 text-[10px] uppercase tracking-widest border-b border-stone-800">
                                    Chronique
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
                            {filteredCharacters.map((char, index) => (
                                <MotionFade
                                    key={char.id}
                                    delay={index * 0.03}
                                    tag="tr"
                                    className="hover:bg-stone-800/20 transition-colors group cursor-default"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-900/20 border border-amber-900/30 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                <User size={20} className="text-amber-600" />
                                            </div>
                                            <span className="font-serif font-bold text-xl text-stone-200 group-hover:text-amber-500 transition-colors">
                                                {char.character_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-stone-400 font-medium tracking-wide">{char.player_name}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-stone-500 text-xs font-serif italic">
                                            {getCampaignName(char.setting_id)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-stone-500 text-xs font-mono">
                                            <Clock size={14} className="text-stone-700" />
                                            {new Date(char.last_synced).toLocaleString('fr-FR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="text-stone-600 font-mono text-[10px]">
                                            {formatSize(char.data_size)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => handleViewDetails(char.id)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/20 hover:bg-amber-700 text-amber-500 hover:text-stone-900 rounded-sm font-bold text-xs transition-all border border-amber-900/30 shadow-sm active:scale-95"
                                                title="Voir la fiche détaillée"
                                            >
                                                <Eye size={16} />
                                                <span className="uppercase tracking-widest font-black">Voir</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(char.id)}
                                                className="p-2 text-stone-700 hover:text-rose-500 hover:bg-rose-950/20 rounded-sm transition-all border border-transparent hover:border-rose-900/30"
                                                title="Supprimer la synchronisation"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </MotionFade>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Read-Only Modal View */}
            {selectedCharacter && (
                <CharacterReadOnlyView
                    character={selectedCharacter}
                    onClose={() => setSelectedCharacter(null)}
                />
            )}

            <ConfirmationModal
                isOpen={!!characterToDelete}
                onClose={() => setCharacterToDelete(null)}
                onConfirm={confirmDelete}
                title="Dissoudre la Synchronisation ?"
                message="Attention : Cette action effacera définitivement l'écho de cette fiche dans le cloud. Le voyageur devra se manifester à nouveau pour rétablir le lien."
                confirmLabel="Dissoudre"
                type="danger"
                scheme="mystic"
            />
        </MotionCard>
    );
};

export default GlobalPlayersView;
