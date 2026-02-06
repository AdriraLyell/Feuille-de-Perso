import React, { useState } from 'react';
import { Plus, Trash2, Shield, Zap, Play, Info, Save, Loader2, Pencil } from 'lucide-react';
import { ATTRIBUTE_PRESETS } from '../../../data/defaults/attributes';
import { AttributePreset } from '../../../types/system';
import ThematicModal from '../../../components/ui/ThematicModal';

interface AttributePresetManagerProps {
    dbPresets: AttributePreset[];
    isLoading: boolean;
    onLoadRequested: (preset: any) => void;
    onSaveRequested: (name: string, desc: string) => void;
    onUpdateRequested: (id: string, name: string, desc: string) => void;
    onDeleteRequested: (id: string) => void;
    currentStructureSummary: { label: string; count: number }[];
}

const AttributePresetManager: React.FC<AttributePresetManagerProps> = ({
    dbPresets,
    isLoading,
    onLoadRequested,
    onSaveRequested,
    onUpdateRequested,
    onDeleteRequested,
    currentStructureSummary
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'save' | 'edit'>('save');
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
    const [isOfficial, setIsOfficial] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const openSaveModal = () => {
        setModalMode('save');
        setName("");
        setDescription("");
        setIsOfficial(false);
        setIsModalOpen(true);
    };

    const openEditModal = (preset: AttributePreset) => {
        setModalMode('edit');
        setEditingPresetId(preset.id);
        setName(preset.name);
        setDescription(preset.description);
        setIsOfficial(preset.isOfficial || false);
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        if (modalMode === 'save') {
            onSaveRequested(name, description);
        } else if (editingPresetId) {
            onUpdateRequested(editingPresetId, name, description);
        }

        setIsModalOpen(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-slate-700 uppercase tracking-widest text-sm flex items-center gap-2">
                        <Zap size={18} className="text-amber-600" /> Préréglages d'Attributs
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Configurez rapidement une structure standard ou personnalisée.</p>
                </div>
                <button
                    onClick={openSaveModal}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 px-3 py-1.5 rounded border border-green-100 hover:bg-green-100 transition-colors"
                >
                    <Save size={14} /> Sauvegarder Actu.
                </button>
            </div>

            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <Loader2 className="animate-spin text-amber-600" size={24} />
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Database Presets */}
                    {dbPresets.map(preset => (
                        <div
                            key={preset.id}
                            onClick={() => onLoadRequested(preset)}
                            className="relative bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg p-3 text-left transition-all group/card cursor-pointer flex flex-col justify-between min-h-[105px] shadow-sm hover:shadow-md"
                        >
                            {/* Actions positioned absolutely to be invariant */}
                            <div className="absolute top-2.5 right-2 flex items-center gap-1 z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openEditModal(preset); }}
                                    className="opacity-0 group-hover/card:opacity-100 text-slate-300 hover:text-blue-500 transition-opacity p-0.5"
                                    title="Modifier les informations"
                                >
                                    <Pencil size={12} />
                                </button>
                                {preset.isOfficial ? (
                                    <span title="Officiel" className="p-0.5">
                                        <Shield size={12} className="text-blue-500 fill-blue-50" />
                                    </span>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteRequested(preset.id); }}
                                        className="opacity-0 group-hover/card:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-0.5"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-start mb-1 gap-2 min-h-[28px]">
                                    <span className="font-bold text-slate-700 text-[11px] group-hover/card:text-amber-900 truncate flex-grow pt-0.5 pr-14">
                                        {preset.name}
                                    </span>
                                    <div className="shrink-0 pt-0.5 pr-12">
                                        <div className="flex gap-0.5 items-center">
                                            {preset.structure.map((pave: any, i: number) => {
                                                const isSecondary = (preset.hasSecondary);
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex flex-col gap-0.5 p-0.5 rounded-[1px] border ${isSecondary ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-200'}`}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            {pave.attrs.slice(0, 4).map((_: any, j: number) => (
                                                                <div key={j} className="w-0.5 h-0.5 rounded-full bg-blue-400/70" />
                                                            ))}
                                                        </div>
                                                        {isSecondary && (
                                                            <>
                                                                <div className="h-[0.5px] bg-slate-200 w-full my-0.5" />
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="w-0.5 h-0.5 rounded-full bg-amber-400" />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <span className="block text-[10px] text-slate-500 italic line-clamp-2 leading-tight min-h-[24px]">
                                    {preset.description}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                                <span className="block text-[10px] text-slate-400 italic font-medium">
                                    {preset.structure.length} Pavés
                                </span>
                                <Play size={10} className="text-slate-300 group-hover/card:text-amber-500 shrink-0" />
                            </div>
                        </div>
                    ))}

                    {/* Fallback to hardcoded if DB empty and not loading */}
                    {!isLoading && dbPresets.length === 0 && ATTRIBUTE_PRESETS.map((preset, idx) => (
                        <div
                            key={`hc-${idx}`}
                            onClick={() => onLoadRequested(preset)}
                            className="relative bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg p-3 text-left transition-all group/card cursor-pointer flex flex-col justify-between min-h-[105px] shadow-sm hover:shadow-md"
                        >
                            {/* Actions positioned absolutely to be invariant */}
                            <div className="absolute top-2.5 right-2 flex items-center gap-1 z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openEditModal(preset as any); }}
                                    className="opacity-0 group-hover/card:opacity-100 text-slate-300 hover:text-blue-500 transition-opacity p-0.5"
                                    title="Modifier"
                                >
                                    <Pencil size={12} />
                                </button>
                                {preset.isOfficial && (
                                    <span title="Officiel" className="p-0.5">
                                        <Shield size={12} className="text-blue-500 fill-blue-50" />
                                    </span>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-start mb-1 gap-2 min-h-[28px]">
                                    <span className="font-bold text-slate-700 text-[11px] group-hover/card:text-amber-900 truncate flex-grow pt-0.5 pr-14">
                                        {preset.name}
                                    </span>
                                    <div className="shrink-0 pt-0.5 pr-12">
                                        <div className="flex gap-0.5 items-center">
                                            {preset.structure.map((pave: any, i: number) => {
                                                const isSec = preset.hasSecondary;
                                                return (
                                                    <div key={i} className={`flex flex-col gap-0.5 p-0.5 rounded-[1px] border ${isSec ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'}`}>
                                                        <div className="flex flex-col gap-0.5">
                                                            {(pave.attrs || []).slice(0, 3).map((_: any, j: number) => (
                                                                <div key={j} className="w-0.5 h-0.5 rounded-full bg-blue-400/70" />
                                                            ))}
                                                        </div>
                                                        {isSec && (
                                                            <>
                                                                <div className="h-[0.5px] bg-slate-200 w-full my-0.5" />
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="w-0.5 h-0.5 rounded-full bg-amber-400" />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <span className="block text-[10px] text-slate-500 italic line-clamp-2 leading-tight min-h-[24px]">
                                    {preset.description}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                                <span className="block text-[10px] text-slate-400 italic font-medium">
                                    {preset.structure.length} Pavés
                                </span>
                                <Play size={10} className="text-slate-300 group-hover/card:text-amber-500 shrink-0" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SAVE/EDIT PRESET MODAL */}
            {isModalOpen && (
                <ThematicModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={modalMode === 'save' ? "Sauvegarder en tant que préréglage" : "Modifier le préréglage"}
                    icon={modalMode === 'save' ? <Save size={24} className="text-green-600" /> : <Pencil size={24} className="text-blue-600" />}
                    size="md"
                    footer={
                        <>
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-bold">Annuler</button>
                            <button
                                onClick={handleSubmit}
                                disabled={!name.trim()}
                                className={`px-6 py-2 rounded font-bold shadow text-white disabled:opacity-50 disabled:cursor-not-allowed ${modalMode === 'save' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {modalMode === 'save' ? 'Sauvegarder' : 'Mettre à jour'}
                            </button>
                        </>
                    }
                >
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-slate-600">
                            {modalMode === 'save'
                                ? "Enregistrez cette structure pour la réutiliser dans d'autres campagnes."
                                : "Modifiez les informations de ce préréglage."}
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                    Nom du préréglage {isOfficial && "(Officiel - Non modifiable)"}
                                </label>
                                <input
                                    autoFocus={!isOfficial}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Système 3-Pavés-6-Attributs"
                                    disabled={isOfficial}
                                    className={`w-full border rounded p-2 text-sm outline-none transition-colors ${isOfficial ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                                />
                                {isOfficial && (
                                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                                        <Info size={10} /> Seule la description peut être modifiée pour les préréglages officiels.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Description</label>
                                <textarea
                                    autoFocus={isOfficial}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Décrivez l'usage de ce préréglage..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs focus:border-blue-500 outline-none h-20 resize-none"
                                />
                            </div>
                        </div>

                        {modalMode === 'save' && (
                            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                <h6 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Résumé de la structure :</h6>
                                <div className="flex flex-wrap gap-2">
                                    {currentStructureSummary.map((cat, idx) => (
                                        <div key={idx} className="bg-white px-2 py-1 rounded border border-slate-200 text-[10px] font-bold text-slate-700">
                                            {cat.label} ({cat.count})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ThematicModal>
            )}
        </div>
    );
};

export default AttributePresetManager;
