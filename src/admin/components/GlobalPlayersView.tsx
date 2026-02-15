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
    const [characterToUpdate, setCharacterToUpdate] = useState<SyncedCharacterSummary | null>(null);
    const [updateMessage, setUpdateMessage] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

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
        if (!settingId) return <span className="text-amber-600/70 font-bold flex items-center gap-1"><AlertCircle size={10} /> Orphelin</span>;
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

    const handleSignalUpdate = (char: SyncedCharacterSummary) => {
        setCharacterToUpdate(char);
        setUpdateMessage('');
    };

    const confirmSignalUpdate = async () => {
        if (!characterToUpdate) return;
        setIsUpdating(true);
        try {
            const success = await CharacterSyncService.requestForceUpdate(characterToUpdate.id, updateMessage);
            if (success) {
                // Update local list timestamp to reflect the push
                setCharacters(prev => prev.map(c =>
                    c.id === characterToUpdate.id
                        ? { ...c, last_synced: new Date().toISOString() }
                        : c
                ));
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'GlobalPlayersView.confirmSignalUpdate',
                userMessage: "Échec de l'envoi du signal."
            });
        } finally {
            setIsUpdating(false);
            setCharacterToUpdate(null);
            setUpdateMessage('');
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
        <MotionCard className="p-8 border-stone-800/80 h-[calc(100vh-160px)] flex flex-col bg-stone-950/40 relative overflow-hidden backdrop-blur-sm" hoverEffect="glow">
            {/* Texture background local aux registres */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-10 pointer-events-none" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-amber-900/20 pb-6 relative z-10">
                <div>
                    <h2 className="text-3xl font-serif font-black text-amber-500 flex items-center gap-3 uppercase tracking-widest drop-shadow-sm">
                        <Users className="text-amber-600" size={28} />
                        Registres des Destins
                    </h2>
                    <p className="text-amber-900/60 font-black text-[10px] uppercase tracking-[0.3em] mt-1 ml-10">
                        Archives éthérées des investigateurs synchronisés
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-grow md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-900/50 group-focus-within:text-amber-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="RECHERCHER UNE ÂME OU UN GARDIEN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-stone-900/50 border border-stone-800/50 rounded-sm focus:border-amber-900/50 outline-none text-[11px] font-bold tracking-widest text-stone-200 placeholder-stone-800 transition-all shadow-inner uppercase"
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
                            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900/60 hover:bg-amber-900/20 text-amber-600/80 hover:text-amber-500 rounded-sm font-bold transition-all border border-stone-800 hover:border-amber-900/30 shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span className="text-[10px] uppercase tracking-widest">Invoquer Données</span>
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && characters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-stone-500 flex-grow relative z-10">
                    <div className="relative">
                        <RefreshCw className="animate-spin text-amber-900/20" size={64} />
                        <Loader2 className="animate-spin absolute inset-0 text-amber-600/40" size={64} style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
                    </div>
                    <p className="font-serif italic text-xl tracking-wider mt-6 text-amber-900/40">Exhumation des manuscrits oubliés...</p>
                </div>
            ) : filteredCharacters.length === 0 ? (
                <MotionFade className="flex flex-col items-center justify-center py-24 bg-stone-950/20 rounded-sm border-2 border-dashed border-stone-900/10 flex-grow relative z-10">
                    <Users className="mb-4 opacity-5 text-amber-900" size={84} />
                    <p className="text-2xl font-serif italic text-stone-400">Le silence règne...</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4 text-stone-800">Aucun destin ne correspond à vos runes de recherche.</p>
                </MotionFade>
            ) : (
                <div className="flex-grow overflow-y-auto rounded-sm border border-stone-800/50 bg-stone-950/20 backdrop-blur-sm custom-scrollbar relative z-10 shadow-glass-dark">
                    <table className="w-full border-collapse">
                        <thead className="bg-stone-950/80 sticky top-0 z-10 shadow-md">
                            <tr>
                                <th className="text-left px-6 py-4 font-black text-amber-900/80 text-[10px] uppercase tracking-[0.2em] border-b border-stone-800/50">
                                    Investigateur
                                </th>
                                <th className="text-left px-6 py-4 font-black text-amber-900/80 text-[10px] uppercase tracking-[0.2em] border-b border-stone-800/50">
                                    Gardien
                                </th>
                                <th className="text-left px-6 py-4 font-black text-amber-900/80 text-[10px] uppercase tracking-[0.2em] border-b border-stone-800/50">
                                    Chronique
                                </th>
                                <th className="text-left px-6 py-4 font-black text-amber-900/80 text-[10px] uppercase tracking-[0.2em] border-b border-stone-800/50">
                                    Dernier Signe
                                </th>
                                <th className="text-center px-4 py-4 font-black text-amber-900/80 text-[10px] uppercase tracking-[0.2em] border-b border-stone-800/50">
                                    Poids
                                </th>
                                <th className="text-right px-6 py-4 font-black text-amber-900/80 text-[10px] uppercase tracking-[0.2em] border-b border-stone-800/50">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/30">
                            {filteredCharacters.map((char, index) => (
                                <MotionFade
                                    key={char.id}
                                    delay={index * 0.02}
                                    tag="tr"
                                    className="hover:bg-amber-900/5 transition-all group cursor-default"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-stone-900/80 border border-stone-800 group-hover:border-amber-900/50 flex items-center justify-center shadow-inner transition-colors">
                                                <User size={18} className="text-amber-800 group-hover:text-amber-500 transition-colors" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-serif font-bold text-lg text-stone-200 group-hover:text-amber-400 transition-colors leading-tight">
                                                    {char.character_name}
                                                </span>
                                                <span className="text-[9px] text-stone-600 font-black uppercase tracking-widest">{char.id.split('-')[0]}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-stone-400 font-bold text-xs tracking-wide group-hover:text-stone-200 transition-colors">{char.player_name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-stone-500 text-[11px] font-serif italic group-hover:text-stone-400 transition-colors">
                                            {getCampaignName(char.setting_id)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-stone-600 text-[10px] font-mono group-hover:text-stone-400 transition-colors">
                                            <Clock size={12} className="text-amber-900/40" />
                                            {new Date(char.last_synced).toLocaleDateString('fr-FR')} {new Date(char.last_synced).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="text-stone-700 font-mono text-[9px] group-hover:text-stone-500 transition-colors">
                                            {formatSize(char.data_size)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleSignalUpdate(char)}
                                                className="p-1.5 text-stone-800 hover:text-amber-500 hover:bg-amber-950/20 rounded-sm transition-all"
                                                title="Signaler une mise à jour MJ"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleViewDetails(char.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/20 hover:bg-amber-800 text-amber-600/80 hover:text-stone-900 rounded-sm font-black text-[10px] transition-all border border-amber-900/20 hover:border-amber-600 shadow-sm active:scale-95 uppercase tracking-widest"
                                            >
                                                <Eye size={14} />
                                                Voir
                                            </button>
                                            <button
                                                onClick={() => handleDelete(char.id)}
                                                className="p-1.5 text-stone-800 hover:text-rose-500 hover:bg-rose-950/20 rounded-sm transition-all grayscale hover:grayscale-0 opacity-40 hover:opacity-100"
                                                title="Dissoudre le lien"
                                            >
                                                <Trash2 size={16} />
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

            <ThematicModal
                isOpen={!!characterToUpdate}
                onClose={() => setCharacterToUpdate(null)}
                title="Pousser une Mise à Jour MJ"
                scheme="mystic"
                icon={<RefreshCw size={24} />}
                footer={
                    <div className="flex gap-3 w-full justify-end">
                        <button
                            onClick={() => setCharacterToUpdate(null)}
                            className="px-4 py-2 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-sm font-bold transition-all uppercase text-xs tracking-wider"
                        >
                            Abjurer
                        </button>
                        <button
                            onClick={confirmSignalUpdate}
                            disabled={isUpdating}
                            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-sm font-bold transition-all shadow-lg active:scale-95 uppercase tracking-wider text-xs disabled:opacity-50"
                        >
                            {isUpdating ? "Incantation..." : "Envoyer le Signal"}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-stone-400 text-xs italic leading-relaxed">
                        Le lien avec <strong>{characterToUpdate?.character_name}</strong> sera marqué comme "mis à jour" par le Gardien des Archives. Le joueur recevra ce message lors de sa prochaine connexion.
                    </p>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/80 mb-2">
                            Message du Gardien (Optionnel)
                        </label>
                        <textarea
                            value={updateMessage}
                            onChange={(e) => setUpdateMessage(e.target.value)}
                            placeholder="Ex: J'ai ajouté tes récompenses de quête..."
                            className="w-full h-32 bg-stone-900/50 border border-stone-800 rounded-sm p-3 text-sm text-stone-200 focus:border-amber-900/50 outline-none resize-none transition-all placeholder:text-stone-700"
                        />
                    </div>
                </div>
            </ThematicModal>
        </MotionCard>
    );
};

export default GlobalPlayersView;
