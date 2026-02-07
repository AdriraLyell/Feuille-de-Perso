/**
 * CampaignCharactersView
 * 
 * Lists all synced character sheets for a campaign (Admin view).
 */

import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, User, Clock, Eye } from 'lucide-react';
import { CharacterSyncService, SyncedCharacter, SyncedCharacterSummary } from '../../services/CharacterSyncService';
import CharacterReadOnlyView from './CharacterReadOnlyView';

interface CampaignCharactersViewProps {
    settingId: string;
}

const CampaignCharactersView: React.FC<CampaignCharactersViewProps> = ({ settingId }) => {
    const [characters, setCharacters] = useState<SyncedCharacterSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState<SyncedCharacter | null>(null);
    const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);

    useEffect(() => {
        loadCharacters();
    }, [settingId]);

    const loadCharacters = async () => {
        setIsLoading(true);
        const data = await CharacterSyncService.getCharactersBySettingId(settingId);
        setCharacters(data);
        setIsLoading(false);
    };

    const handleViewCharacter = async (id: string) => {
        setIsLoadingCharacter(true);
        const character = await CharacterSyncService.getCharacterById(id);
        if (character) {
            setSelectedCharacter(character);
        }
        setIsLoadingCharacter(false);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Users className="text-purple-600" />
                        Fiches des Joueurs
                    </h2>
                    <p className="text-slate-500 italic">
                        Personnages synchronisés par les joueurs de cette campagne.
                    </p>
                </div>
                <button
                    onClick={loadCharacters}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Rafraîchir
                </button>
            </div>

            {isLoading && characters.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <RefreshCw size={32} className="animate-spin mx-auto mb-4" />
                    Chargement des fiches...
                </div>
            ) : characters.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Aucune fiche synchronisée</p>
                    <p className="text-slate-400 text-sm mt-1">
                        Les joueurs peuvent synchroniser leur fiche depuis l'application Joueur.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-bold text-slate-600 text-sm uppercase tracking-wider">
                                    Personnage
                                </th>
                                <th className="text-left px-4 py-3 font-bold text-slate-600 text-sm uppercase tracking-wider">
                                    Joueur
                                </th>
                                <th className="text-left px-4 py-3 font-bold text-slate-600 text-sm uppercase tracking-wider">
                                    Dernière Sync
                                </th>
                                <th className="text-right px-4 py-3 font-bold text-slate-600 text-sm uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {characters.map(char => (
                                <tr
                                    key={char.id}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                <User size={20} className="text-purple-600" />
                                            </div>
                                            <span className="font-bold text-slate-800">{char.character_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">
                                        {char.player_name}
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} />
                                            {new Date(char.last_synced).toLocaleString('fr-FR')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button
                                            onClick={() => handleViewCharacter(char.id)}
                                            disabled={isLoadingCharacter}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-bold text-sm transition-colors"
                                        >
                                            <Eye size={16} />
                                            Voir
                                        </button>
                                    </td>
                                </tr>
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
                />
            )}
        </div>
    );
};

export default CampaignCharactersView;
