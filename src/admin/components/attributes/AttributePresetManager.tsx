import React, { useState } from 'react';
import { Plus, Trash2, Shield, Zap, Play, Info, Save, Loader2 } from 'lucide-react';
import { ATTRIBUTE_PRESETS } from '../../../data/defaults/attributes';
import ThematicModal from '../../../components/ui/ThematicModal';

interface AttributePresetManagerProps {
    dbPresets: any[];
    isLoading: boolean;
    onLoadRequested: (preset: any) => void;
    onSaveRequested: (name: string, desc: string) => void;
    onDeleteRequested: (id: string) => void;
    currentStructureSummary: { label: string; count: number }[];
}

const AttributePresetManager: React.FC<AttributePresetManagerProps> = ({
    dbPresets,
    isLoading,
    onLoadRequested,
    onSaveRequested,
    onDeleteRequested,
    currentStructureSummary
}) => {
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");
    const [newPresetDesc, setNewPresetDesc] = useState("");

    const handleSave = () => {
        if (!newPresetName.trim()) return;
        onSaveRequested(newPresetName, newPresetDesc);
        setNewPresetName("");
        setNewPresetDesc("");
        setIsSaveModalOpen(false);
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
                    onClick={() => setIsSaveModalOpen(true)}
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
                            className="relative bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded p-3 text-left transition-all group/card cursor-pointer flex flex-col justify-between min-h-[80px]"
                        >
                            <div>
                                <div className="flex justify-between items-center mb-1 gap-2">
                                    <span className="font-bold text-slate-700 text-xs group-hover/card:text-amber-900 truncate flex-grow">
                                        {preset.name}
                                    </span>
                                    <div className="flex gap-0.5 items-center">
                                        {preset.structure.map((pave: any, i: number) => {
                                            const isSecondary = (preset.has_secondary || preset.hasSecondary);
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
                                    <div className="shrink-0 flex items-center">
                                        {preset.isOfficial ? (
                                            <span title="Officiel"><Shield size={12} className="text-blue-400" /></span>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteRequested(preset.id); }}
                                                className="opacity-0 group-hover/card:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <span className="block text-[10px] text-slate-500 italic line-clamp-2 leading-tight">
                                    {preset.description}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                                <span className="block text-[10px] text-slate-400 italic font-medium">
                                    {preset.structure.length} Pavés
                                </span>
                                <Play size={10} className="text-slate-300 group-hover/card:text-amber-500 shrink-0" />
                            </div>
                        </div>
                    ))}

                    {/* Fallback to hardcoded if DB empty and not loading */}
                    {!isLoading && dbPresets.length === 0 && ATTRIBUTE_PRESETS.map((preset, idx) => (
                        <button
                            key={`hc-${idx}`}
                            onClick={() => onLoadRequested(preset)}
                            className="bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded p-3 text-left transition-all group/card flex flex-col justify-between min-h-[80px]"
                        >
                            <div className="flex justify-between items-center mb-1 gap-2">
                                <div className="min-w-0 flex-grow">
                                    <span className="block font-bold text-slate-700 text-xs group-hover/card:text-amber-900 truncate">{preset.name}</span>
                                    <span className="text-[10px] text-slate-400 italic font-medium leading-tight truncate">{preset.structure.length} Pavés</span>
                                </div>
                                <div className="flex gap-0.5 items-center shrink-0">
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
                            <div className="mt-1 flex items-center justify-between">
                                <span className="block text-[10px] text-slate-400 italic font-medium">
                                    {preset.structure.length} Pavés
                                </span>
                                <Play size={10} className="text-slate-300 group-hover/card:text-amber-500 shrink-0" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* SAVE PRESET MODAL */}
            {isSaveModalOpen && (
                <ThematicModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    title="Sauvegarder en tant que préréglage"
                    icon={<Save size={24} className="text-green-600" />}
                    size="md"
                    footer={
                        <>
                            <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-bold">Annuler</button>
                            <button
                                onClick={handleSave}
                                disabled={!newPresetName.trim()}
                                className="px-6 py-2 bg-green-600 text-white rounded font-bold shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sauvegarder
                            </button>
                        </>
                    }
                >
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-slate-600">
                            Enregistrez cette structure pour la réutiliser dans d'autres campagnes.
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nom du préréglage</label>
                                <input
                                    autoFocus
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    placeholder="Ex: Système 3-Pavés-6-Attributs"
                                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:border-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Description (Optionnel)</label>
                                <textarea
                                    value={newPresetDesc}
                                    onChange={(e) => setNewPresetDesc(e.target.value)}
                                    placeholder="Décrivez l'usage de ce préréglage..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs focus:border-green-500 outline-none h-20 resize-none"
                                />
                            </div>
                        </div>
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
                    </div>
                </ThematicModal>
            )}
        </div>
    );
};

export default AttributePresetManager;
