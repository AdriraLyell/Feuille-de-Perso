
import React from 'react';
import { LibraryEntry, TraitEffect } from '../../types';
import { Edit2, Plus, X, AlignLeft, Save, AlertCircle } from 'lucide-react';
import TraitEffectEditor from './TraitEffectEditor';

interface TraitFormProps {
    editForm: LibraryEntry;
    library: LibraryEntry[];
    allSkills: { id: string, name: string }[];
    allAttributes: { id: string, name: string }[];
    tagInput: string;
    error: string | null;
    setEditForm: (entry: LibraryEntry | null) => void;
    setTagInput: (val: string) => void;
    onClose: () => void;
    onSave: () => void;
    addTag: () => void;
    removeTag: (tag: string) => void;
    addEffect: () => void;
    updateEffect: (id: string, field: keyof TraitEffect, value: any) => void;
    removeEffect: (id: string) => void;
}

const TraitForm: React.FC<TraitFormProps> = ({
    editForm,
    library,
    allSkills,
    allAttributes,
    tagInput,
    error,
    setEditForm,
    setTagInput,
    onClose,
    onSave,
    addTag,
    removeTag,
    addEffect,
    updateEffect,
    removeEffect
}) => {
    const isNew = !library.some(l => l.id === editForm.id);

    return (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className={`p-4 border-b flex justify-between items-center text-white ${editForm.type === 'avantage' ? 'bg-green-600' : 'bg-red-600'} transition-colors duration-300`}>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {isNew ? <Plus size={20} /> : <Edit2 size={20} />}
                        {isNew ? 'Nouveau Trait' : 'Éditer le Trait'}
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 bg-gray-50 flex flex-col gap-5">

                    {/* Type Switcher */}
                    <div className="flex justify-center">
                        <div className="bg-gray-200 p-1 rounded-lg flex shadow-inner">
                            <button
                                onClick={() => setEditForm({ ...editForm, type: 'avantage' })}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${editForm.type === 'avantage' ? 'bg-white text-green-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Avantage
                            </button>
                            <button
                                onClick={() => setEditForm({ ...editForm, type: 'desavantage' })}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${editForm.type === 'desavantage' ? 'bg-white text-red-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Désavantage
                            </button>
                        </div>
                    </div>

                    {/* Name & Cost */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nom du Trait</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-bold text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none placeholder-gray-400"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Ex: Chance, Ennemi..."
                                autoFocus
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Coût</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 bg-white"
                                value={editForm.cost}
                                onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                                placeholder="Pt"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 flex items-center gap-1"><AlignLeft size={12} /> Description</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white min-h-[100px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y placeholder-gray-400"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Décrivez les effets narratifs ou les conditions d'utilisation..."
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tags (Catégories)</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                className="flex-grow border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder="Ajouter un tag..."
                            />
                            <button onClick={addTag} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold">
                                +
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {(editForm.tags || []).map(tag => (
                                <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-blue-200">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Effects Section */}
                    <TraitEffectEditor
                        effects={editForm.effects || []}
                        allSkills={allSkills}
                        allAttributes={allAttributes}
                        onAdd={addEffect}
                        onUpdate={updateEffect}
                        onRemove={removeEffect}
                    />

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-bold animate-pulse">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onSave}
                        className={`px-6 py-2 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105 ${editForm.type === 'avantage' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        <Save size={18} />
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TraitForm;
