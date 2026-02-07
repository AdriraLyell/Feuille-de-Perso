/**
 * CharacterReadOnlyView
 * 
 * Displays a synced character sheet in read-only mode for Admin viewing.
 */

import React from 'react';
import { X, User, Star, Book, Shield, Backpack } from 'lucide-react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { CharacterSheetData } from '../../types/character';

interface CharacterReadOnlyViewProps {
    character: SyncedCharacter;
    onClose: () => void;
}

const CharacterReadOnlyView: React.FC<CharacterReadOnlyViewProps> = ({ character, onClose }) => {
    const data = character.data as CharacterSheetData;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User size={20} />
                            {character.character_name}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Joueur : {character.player_name} •
                            Sync : {new Date(character.last_synced).toLocaleString('fr-FR')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 flex-grow space-y-6">

                    {/* Header Info */}
                    <section className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <User size={18} /> Identité
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400 block">Nom</span>
                                <span className="font-bold">{data.header?.name || '-'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Joueur</span>
                                <span className="font-bold">{data.header?.player || '-'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Chronique</span>
                                <span className="font-bold">{data.header?.chronicle || '-'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Nature</span>
                                <span className="font-bold">{data.header?.nature || '-'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Attributes */}
                    <section className="bg-amber-50 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                            <Star size={18} /> Attributs
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(data.attributes || {}).map(([category, attrs]) => (
                                <div key={category} className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="font-bold text-amber-700 text-sm uppercase mb-2">{category}</h4>
                                    {(attrs as any[]).map((attr, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{attr.name}</span>
                                            <span className="font-bold">{attr.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Skills Summary */}
                    <section className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                            <Book size={18} /> Compétences (Résumé)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {Object.entries(data.skills || {}).map(([category, skills]) => {
                                const activeSkills = (skills as any[]).filter(s => s.value > 0);
                                return (
                                    <div key={category} className="bg-white p-2 rounded shadow-sm">
                                        <h4 className="font-bold text-blue-700 text-xs uppercase">{category}</h4>
                                        <span className="text-lg font-bold text-blue-600">{activeSkills.length}</span>
                                        <span className="text-blue-400 text-xs ml-1">actives</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Experience */}
                    <section className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                            <Shield size={18} /> Expérience
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white p-3 rounded shadow-sm">
                                <span className="text-purple-400 block text-xs uppercase">Total Gagné</span>
                                <span className="text-2xl font-bold text-purple-700">{data.experience?.gain || 0}</span>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                                <span className="text-purple-400 block text-xs uppercase">Dépensé</span>
                                <span className="text-2xl font-bold text-purple-700">{data.experience?.spent || 0}</span>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                                <span className="text-purple-400 block text-xs uppercase">Restant</span>
                                <span className="text-2xl font-bold text-green-600">{data.experience?.rest || 0}</span>
                            </div>
                        </div>
                    </section>

                    {/* Equipment Preview */}
                    {data.page2?.equipement && (
                        <section className="bg-stone-50 p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
                                <Backpack size={18} /> Équipement
                            </h3>
                            <div className="bg-white p-3 rounded shadow-sm text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {data.page2.equipement || '-'}
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CharacterReadOnlyView;
