/**
 * GlobalPlayersView
 * 
 * Admin view to list ALL synchronized characters across all campaigns.
 * Useful for finding "orphaned" characters or tracking player activity globally.
 */

import React, { useState, useEffect } from 'react';
import { Users, Search, Eye, Trash2, Calendar, Shield, AlertCircle } from 'lucide-react';
import { CharacterSyncService, SyncedCharacterSummary, SyncedCharacter } from '../../services/CharacterSyncService';
import CharacterReadOnlyView from './CharacterReadOnlyView';
import { GameSettingSummary, CampaignService } from '../../services/CampaignService';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

import { ErrorService } from '../../services/ErrorService';
import { Loader2 } from 'lucide-react';

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
        <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-900/80 p-6 rounded-sm shadow-glass border border-stone-800">
                <div>
                    <h2 className="text-2xl font-serif font-black text-amber-500 flex items-center gap-3 uppercase tracking-widest">
                        <Users className="text-amber-600" />
                        Registres des Voyageurs
                    </h2>
                    <p className="text-stone-500 font-bold text-[10px] uppercase tracking-widest mt-1">Vue globale de tous les personnages synchronisés dans l'éther.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher une âme ou un joueur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-sm focus:border-amber-900/50 outline-none text-sm text-stone-200 placeholder-stone-700 transition-all shadow-inner"
                        />
                    </div>

                    <button
                        onClick={() => setFilterOrphans(!filterOrphans)}
                        className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${filterOrphans
                            ? 'bg-amber-900/30 text-amber-500 border-amber-900/50 shadow-glow-amber'
                            : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-stone-300 hover:border-stone-700'
                            }`}
                        title="Afficher uniquement les personnages dont la campagne a été supprimée"
                    >
                        <AlertCircle size={14} />
                        Orphelins
                    </button>

                    <button
                        onClick={loadData}
                        className="p-2 bg-stone-950 text-stone-500 border border-stone-800 rounded-sm hover:text-amber-500 hover:border-amber-900/30 transition-all active:scale-95"
                        title="Rafraîchir"
                    >
                        <Calendar size={18} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-500 bg-stone-900/40 rounded-sm border border-stone-800 shadow-glass flex-grow">
                    <Loader2 className="animate-spin mb-4 text-amber-600" size={40} />
                    <p className="font-serif italic text-lg">Consultation des archives éthérées...</p>
                </div>
            ) : filteredCharacters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-500 bg-stone-900/40 rounded-sm border border-stone-800 shadow-glass flex-grow">
                    <Users className="mb-4 opacity-10" size={64} />
                    <p className="text-xl font-serif italic">Le vide s'étend devant vous...</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2">Aucune âme ne correspond à votre recherche.</p>
                </div>
            ) : (
                <div className="bg-stone-900/40 rounded-sm shadow-glass border border-stone-800 overflow-y-auto flex-grow custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-950/60 border-b border-stone-800 text-amber-900 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="px-6 py-4">Voyageur</th>
                                <th className="px-6 py-4">Gardien (Joueur)</th>
                                <th className="px-6 py-4">Chronique</th>
                                <th className="px-6 py-4">Dernière Sync</th>
                                <th className="px-6 py-4 text-center">Poids</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/30">
                            {filteredCharacters.map((char) => (
                                <tr key={char.id} className="hover:bg-amber-900/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-serif font-bold text-lg text-stone-200 flex items-center gap-2 group-hover:text-amber-500 transition-colors">
                                            <Shield size={16} className="text-amber-700/50 group-hover:text-amber-500" />
                                            {char.character_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-amber-900/20 border border-amber-900/30 flex items-center justify-center text-[10px] font-black text-amber-600">
                                                {char.player_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-stone-400 font-medium tracking-wide">{char.player_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-stone-500 text-xs font-serif italic">
                                            {getCampaignName(char.setting_id)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-stone-500 font-mono text-[10px]">
                                            <Calendar size={12} className="text-stone-700" />
                                            {new Date(char.last_synced).toLocaleString('fr-FR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-stone-600 font-mono text-[10px]">
                                            {formatSize(char.data_size)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleViewDetails(char.id)}
                                                className="p-2 text-stone-500 hover:text-amber-500 hover:bg-stone-800/50 rounded-sm transition-all border border-transparent hover:border-amber-900/30"
                                                title="Voir la fiche détaillée"
                                            >
                                                <Eye size={18} />
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
                                </tr>
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
        </div>
    );
};

export default GlobalPlayersView;
