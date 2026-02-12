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
        <div className="bg-stone-900/40 p-6 rounded-sm shadow-sm border border-stone-700/50 mb-8 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-serif font-bold text-stone-300 uppercase tracking-widest text-sm flex items-center gap-2">
                        <Zap size={18} className="text-amber-500" /> Préréglages d'Attributs
                    </h3>
                    <p className="text-[10px] text-stone-500 font-medium tracking-wide">Configurez rapidement une structure standard ou personnalisée.</p>
                </div>
                <button
                    onClick={openSaveModal}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-stone-950 text-amber-500 px-3 py-1.5 rounded-sm border border-stone-700 hover:bg-stone-800 transition-colors shadow-sm"
                >
                    <Save size={14} /> Sauvegarder Actu.
                </button>
            </div>

            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-stone-950/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <Loader2 className="animate-spin text-amber-500" size={24} />
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Database Presets */}
                    {dbPresets.map(preset => (
                        <div
                            key={preset.id}
                            onClick={() => onLoadRequested(preset)}
                            className="relative bg-stone-950/50 border border-stone-700/50 hover:border-amber-500/50 hover:bg-stone-900 rounded-sm p-3 text-left transition-all group/card cursor-pointer flex flex-col justify-between min-h-[105px] shadow-sm hover:shadow-glow-gold"
                        >
                            {/* Actions positioned absolutely to be invariant */}
                            <div className="absolute top-2.5 right-2 flex items-center gap-1 z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openEditModal(preset); }}
                                    className="opacity-0 group-hover/card:opacity-100 text-stone-500 hover:text-amber-500 transition-opacity p-0.5"
                                    title="Modifier les informations"
                                >
                                    <Pencil size={12} />
                                </button>
                                {preset.isOfficial ? (
                                    <span title="Officiel" className="p-0.5">
                                        <Shield size={12} className="text-amber-500/50 fill-amber-500/10" />
                                    </span>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteRequested(preset.id); }}
                                        className="opacity-0 group-hover/card:opacity-100 text-stone-500 hover:text-crimson-blood transition-opacity p-0.5"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-start mb-1 gap-2 min-h-[28px]">
                                    <span className="font-bold text-stone-400 text-[11px] group-hover/card:text-amber-500 truncate flex-grow pt-0.5 pr-14 transition-colors font-serif tracking-wide">
                                        {preset.name}
                                    </span>
                                    <div className="shrink-0 pt-0.5 pr-12">
                                        <div className="flex gap-0.5 items-center">
                                            {preset.structure.map((pave: any, i: number) => {
                                                const isSecondary = (preset.hasSecondary);
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex flex-col gap-0.5 p-0.5 rounded-[1px] border ${isSecondary ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-900 border-stone-800'}`}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            {pave.attrs.slice(0, 4).map((_: any, j: number) => (
                                                                <div key={j} className="w-0.5 h-0.5 rounded-full bg-stone-500" />
                                                            ))}
                                                        </div>
                                                        {isSecondary && (
                                                            <>
                                                                <div className="h-[0.5px] bg-stone-700 w-full my-0.5" />
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="w-0.5 h-0.5 rounded-full bg-amber-600" />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <span className="block text-[10px] text-stone-600 italic line-clamp-2 leading-tight min-h-[24px] group-hover/card:text-stone-500 transition-colors">
                                    {preset.description}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-stone-800 pt-2 group-hover/card:border-stone-700 transition-colors">
                                <span className="block text-[10px] text-stone-600 italic font-medium">
                                    {preset.structure.length} Pavés
                                </span>
                                <Play size={10} className="text-stone-700 group-hover/card:text-amber-500 shrink-0 transition-colors" />
                            </div>
                        </div>
                    ))}

                    {/* Fallback to hardcoded if DB empty and not loading */}
                    {!isLoading && dbPresets.length === 0 && ATTRIBUTE_PRESETS.map((preset, idx) => (
                        <div
                            key={`hc-${idx}`}
                            onClick={() => onLoadRequested(preset)}
                            className="relative bg-stone-950/50 border border-stone-700/50 hover:border-amber-500/50 hover:bg-stone-900 rounded-sm p-3 text-left transition-all group/card cursor-pointer flex flex-col justify-between min-h-[105px] shadow-sm hover:shadow-glow-gold"
                        >
                            {/* Actions positioned absolutely to be invariant */}
                            <div className="absolute top-2.5 right-2 flex items-center gap-1 z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openEditModal(preset as any); }}
                                    className="opacity-0 group-hover/card:opacity-100 text-stone-500 hover:text-amber-500 transition-opacity p-0.5"
                                    title="Modifier"
                                >
                                    <Pencil size={12} />
                                </button>
                                {preset.isOfficial && (
                                    <span title="Officiel" className="p-0.5">
                                        <Shield size={12} className="text-amber-500/50 fill-amber-500/10" />
                                    </span>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-start mb-1 gap-2 min-h-[28px]">
                                    <span className="font-bold text-stone-400 text-[11px] group-hover/card:text-amber-500 truncate flex-grow pt-0.5 pr-14 transition-colors font-serif tracking-wide">
                                        {preset.name}
                                    </span>
                                    <div className="shrink-0 pt-0.5 pr-12">
                                        <div className="flex gap-0.5 items-center">
                                            {preset.structure.map((pave: any, i: number) => {
                                                const isSec = preset.hasSecondary;
                                                return (
                                                    <div key={i} className={`flex flex-col gap-0.5 p-0.5 rounded-[1px] border ${isSec ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-900 border-stone-800'}`}>
                                                        <div className="flex flex-col gap-0.5">
                                                            {(pave.attrs || []).slice(0, 3).map((_: any, j: number) => (
                                                                <div key={j} className="w-0.5 h-0.5 rounded-full bg-stone-500" />
                                                            ))}
                                                        </div>
                                                        {isSec && (
                                                            <>
                                                                <div className="h-[0.5px] bg-stone-700 w-full my-0.5" />
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="w-0.5 h-0.5 rounded-full bg-amber-600" />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <span className="block text-[10px] text-stone-600 italic line-clamp-2 leading-tight min-h-[24px] group-hover/card:text-stone-500 transition-colors">
                                    {preset.description}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-stone-800 pt-2 group-hover/card:border-stone-700 transition-colors">
                                <span className="block text-[10px] text-stone-600 italic font-medium">
                                    {preset.structure.length} Pavés
                                </span>
                                <Play size={10} className="text-stone-700 group-hover/card:text-amber-500 shrink-0 transition-colors" />
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
                    icon={modalMode === 'save' ? <Save size={24} className="text-amber-500" /> : <Pencil size={24} className="text-amber-500" />}
                    size="md"
                    footer={
                        <>
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-stone-500 hover:text-stone-300 font-bold uppercase text-xs tracking-wider transition-colors">Annuler</button>
                            <button
                                onClick={handleSubmit}
                                disabled={!name.trim()}
                                className={`px-6 py-2 rounded-sm font-bold shadow-glow-gold text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-wider transition-all hover:scale-105 ${modalMode === 'save' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                            >
                                {modalMode === 'save' ? 'Sauvegarder' : 'Mettre à jour'}
                            </button>
                        </>
                    }
                >
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-stone-400 font-medium">
                            {modalMode === 'save'
                                ? "Enregistrez cette structure pour la réutiliser dans d'autres campagnes."
                                : "Modifiez les informations de ce préréglage."}
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 tracking-wider">
                                    Nom du préréglage {isOfficial && "(Officiel - Non modifiable)"}
                                </label>
                                <input
                                    autoFocus={!isOfficial}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Système 3-Pavés-6-Attributs"
                                    disabled={isOfficial}
                                    className={`w-full border rounded-sm p-2 text-sm outline-none transition-colors font-serif tracking-wide ${isOfficial ? 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed' : 'bg-stone-950 border-stone-700 text-stone-200 focus:border-amber-500 placeholder-stone-700'}`}
                                />
                                {isOfficial && (
                                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-bold">
                                        <Info size={10} /> Seule la description peut être modifiée pour les préréglages officiels.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 tracking-wider">Description</label>
                                <textarea
                                    autoFocus={isOfficial}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Décrivez l'usage de ce préréglage..."
                                    className="w-full bg-stone-950 border border-stone-700 text-stone-300 rounded-sm p-2 text-xs focus:border-amber-500 outline-none h-20 resize-none header-stone-700"
                                />
                            </div>
                        </div>

                        {modalMode === 'save' && (
                            <div className="bg-stone-950/50 p-3 rounded-sm border border-stone-800">
                                <h6 className="text-[10px] font-bold text-stone-500 uppercase mb-2 tracking-wider">Résumé de la structure :</h6>
                                <div className="flex flex-wrap gap-2">
                                    {currentStructureSummary.map((cat, idx) => (
                                        <div key={idx} className="bg-stone-900 px-2 py-1 rounded-sm border border-stone-700 text-[10px] font-bold text-stone-400 uppercase tracking-wide">
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
