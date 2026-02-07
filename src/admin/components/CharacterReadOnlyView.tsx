/**
 * CharacterReadOnlyView
 * 
 * Displays a synced character sheet in read-only mode for Admin viewing.
 */

import React from 'react';
import { X, User, Star, Book, Shield, Backpack, Award, Zap } from 'lucide-react';
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
                        <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2 border-b pb-1">
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
                        <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2 border-b border-amber-200 pb-1">
                            <Star size={18} /> Attributs
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(data.attributeSettings || []).map((setting) => {
                                const attrs = data.attributes?.[setting.id] || [];
                                return (
                                    <div key={setting.id} className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 bg-amber-100/50 px-2 py-0.5 rounded w-fit">
                                            {setting.label}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {(attrs as any[]).map((attr, idx) => {
                                                const total = (parseInt(attr.val1) || 0) + (parseInt(attr.val2) || 0) + (parseInt(attr.val3) || 0);
                                                return (
                                                    <div key={idx} className="bg-white px-3 py-1.5 rounded shadow-sm flex justify-between items-center text-sm border border-amber-100">
                                                        <span className="text-slate-600 font-medium">{attr.name}</span>
                                                        <span className="font-bold text-amber-700">{total}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Skills - Original Categories Layout */}
                    <section className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2 border-b border-blue-200 pb-1">
                            <Book size={18} /> Compétences
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Object.entries(data.skills || {})
                                .filter(([category, skills]) => {
                                    const active = (skills as any[]).filter(s => s.name && s.value > 0);
                                    return active.length > 0 &&
                                        !category.toLowerCase().includes('background') &&
                                        !category.toLowerCase().includes('arrière-plan') &&
                                        category !== 'Col_Comp_8';
                                })
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([category, skills]) => (
                                    <div key={category} className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 bg-blue-100/50 px-2 py-0.5 rounded w-fit">
                                            {category.replace('Col_Comp_', 'Série ')}
                                        </h4>
                                        <div className="space-y-1">
                                            {(skills as any[]).filter(s => s.name && s.value > 0).map((skill, idx) => (
                                                <div key={idx} className="bg-white px-2 py-1 rounded shadow-sm flex justify-between items-center text-xs border border-blue-100">
                                                    <span className="text-slate-700 truncate mr-2" title={skill.name}>{skill.name}</span>
                                                    <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{skill.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </section>

                    {/* Backgrounds */}
                    {Object.entries(data.skills || {})
                        .filter(([category]) => category.toLowerCase().includes('background') || category.toLowerCase().includes('arrière-plan') || category === 'Col_Comp_8')
                        .flatMap(([_, skills]) => (skills as any[]).filter(s => s.name && s.value > 0)).length > 0 && (
                            <section className="bg-orange-50 p-4 rounded-lg">
                                <h3 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2 border-b border-orange-200 pb-1">
                                    <Award size={18} /> Arrière-plans
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {Object.entries(data.skills || {})
                                        .filter(([category]) => category.toLowerCase().includes('background') || category.toLowerCase().includes('arrière-plan') || category === 'Col_Comp_8')
                                        .flatMap(([_, skills]) => (skills as any[]).filter(s => s.name && s.value > 0))
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((bg, idx) => (
                                            <div key={idx} className="bg-white px-3 py-2 rounded shadow-sm flex justify-between items-center text-sm border border-orange-100">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{bg.name}</span>
                                                    {bg.variant && <span className="text-[10px] text-slate-500 italic">{bg.variant}</span>}
                                                </div>
                                                <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">{bg.value}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </section>
                        )}

                    {/* Traits (Advantages / Disadvantages) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(data.page2?.avantages || []).filter(t => t.name && t.name.trim() !== '').length > 0 && (
                            <section className="bg-emerald-50 p-4 rounded-lg">
                                <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2 border-b border-emerald-200 pb-1">
                                    <Zap size={18} /> Avantages
                                </h3>
                                <div className="space-y-2">
                                    {data.page2.avantages
                                        .filter(t => t.name && t.name.trim() !== '')
                                        .map((trait, idx) => (
                                            <div key={idx} className="bg-white p-2 rounded shadow-sm border border-emerald-100 flex justify-between items-start gap-2">
                                                <div>
                                                    <div className="font-bold text-sm text-emerald-900">{trait.name}</div>
                                                    {trait.variant && <div className="text-[10px] text-slate-500 italic">{trait.variant}</div>}
                                                </div>
                                                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs">+{trait.value}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </section>
                        )}

                        {(data.page2?.desavantages || []).filter(t => t.name && t.name.trim() !== '').length > 0 && (
                            <section className="bg-red-50 p-4 rounded-lg">
                                <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2 border-b border-red-200 pb-1">
                                    <Zap size={18} className="rotate-180" /> Désavantages
                                </h3>
                                <div className="space-y-2">
                                    {data.page2.desavantages
                                        .filter(t => t.name && t.name.trim() !== '')
                                        .map((trait, idx) => (
                                            <div key={idx} className="bg-white p-2 rounded shadow-sm border border-red-100 flex justify-between items-start gap-2">
                                                <div>
                                                    <div className="font-bold text-sm text-red-900">{trait.name}</div>
                                                    {trait.variant && <div className="text-[10px] text-slate-500 italic">{trait.variant}</div>}
                                                </div>
                                                <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-xs">-{trait.value}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Experience */}
                    <section className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2 border-b border-purple-200 pb-1">
                            <Shield size={18} /> Expérience
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white p-2 rounded shadow-sm border border-purple-100">
                                <span className="text-purple-400 block text-[10px] uppercase font-bold">Gagné</span>
                                <span className="text-xl font-bold text-purple-700">{data.experience?.gain || 0}</span>
                            </div>
                            <div className="bg-white p-2 rounded shadow-sm border border-purple-100">
                                <span className="text-purple-400 block text-[10px] uppercase font-bold">Dépensé</span>
                                <span className="text-xl font-bold text-purple-700">{data.experience?.spent || 0}</span>
                            </div>
                            <div className="bg-white p-2 rounded shadow-sm border border-purple-100">
                                <span className="text-purple-400 block text-[10px] uppercase font-bold">Restant</span>
                                <span className="text-xl font-bold text-green-600">{data.experience?.rest || 0}</span>
                            </div>
                        </div>
                    </section>

                    {/* Equipment Preview */}
                    {data.page2?.equipement && (
                        <section className="bg-stone-50 p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2 border-b border-stone-200 pb-1">
                                <Backpack size={18} /> Équipement
                            </h3>
                            <div className="bg-white p-3 rounded shadow-sm text-sm whitespace-pre-wrap max-h-32 overflow-y-auto border border-stone-200">
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
