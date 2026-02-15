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
        if (!settingId) return <span className="text-amber-600 font-bold flex items-center gap-1"><AlertCircle size={14} /> Orphelin</span>;
        const campaign = campaigns.find(c => c.id === settingId);
        return campaign ? campaign.name : <span className="text-stone-400 italic">Inconnue</span>;
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Users className="text-indigo-600" />
                        Master List des Joueurs
                    </h2>
                    <p className="text-slate-500 text-sm">Vue globale de tous les personnages synchronisés sur le cloud.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher personnage ou joueur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>

                    <button
                        onClick={() => setFilterOrphans(!filterOrphans)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${filterOrphans
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                        title="Afficher uniquement les personnages dont la campagne a été supprimée"
                    >
                        <AlertCircle size={18} />
                        Orphelins
                    </button>

                    <button
                        onClick={loadData}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Rafraîchir"
                    >
                        <Calendar size={20} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Loader2 className="animate-spin mb-4 text-indigo-600" size={40} />
                    <p>Chargement de la base de données joueurs...</p>
                </div>
            ) : filteredCharacters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Users className="mb-4 opacity-20" size={64} />
                    <p className="text-lg font-medium">Aucun personnage trouvé</p>
                    <p className="text-sm">Essayez d'ajuster vos filtres ou de réinitialiser la recherche.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Personnage</th>
                                <th className="px-6 py-4">Joueur</th>
                                <th className="px-6 py-4">Campagne</th>
                                <th className="px-6 py-4">Dernière Sync</th>
                                <th className="px-6 py-4 text-center">Taille</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCharacters.map((char) => (
                                <tr key={char.id} className="hover:bg-slate-50/80 transition-colors text-sm">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            <Shield size={16} className="text-indigo-500" />
                                            {char.character_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {char.player_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-slate-600 font-medium">{char.player_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-600">
                                            {getCampaignName(char.setting_id)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(char.last_synced).toLocaleString('fr-FR', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-stone-500 font-mono text-xs">
                                            {formatSize(char.data_size)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleViewDetails(char.id)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Voir la fiche détaillée"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(char.id)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                title="Supprimer la synchronisation ?"
                message="Attention : Cette action supprimera définitivement la fiche du cloud. Le joueur pourra toujours synchroniser sa fiche à nouveau s'il le souhaite."
                confirmLabel="Supprimer"
                type="danger"
            />
        </div>
    );
};

export default GlobalPlayersView;
