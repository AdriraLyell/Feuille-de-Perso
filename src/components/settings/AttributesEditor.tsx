
import React from 'react';
import { CharacterSheetData } from '../../types';
import { Zap, Play, CheckSquare, Info, LayoutGrid } from 'lucide-react';
import ThematicModal from '../ui/ThematicModal';
import { ATTRIBUTE_PRESETS } from '../../data/defaults/attributes';
import { useAttributesEditor } from './hooks/useAttributesEditor';

interface AttributesEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

const AttributesEditor: React.FC<AttributesEditorProps> = ({ data, onUpdate, onAddLog }) => {
    const {
        pendingPreset,
        showPresetConfirm,
        setShowPresetConfirm,
        setPendingPreset,
        categories,
        count,
        globalAttrCount,
        requestPresetLoad,
        executePresetLoad,
        handleCategoryCountChange,
        handleGlobalAttributeCountChange,
        updateCategoryLabel,
        updateAttributeName,
        toggleSecondaryAttributes,
        updateSecondaryAttributeName,
        updateAttributeCost
    } = useAttributesEditor({ data, onUpdate, onAddLog });

    return (
        <div className="bg-[#fdfbf7]/80 backdrop-blur-sm p-6 rounded-sm shadow-md border border-[#bfae85]/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="font-serif font-black text-sm mb-6 text-[#5c4d41] border-b border-[#bfae85]/30 pb-4 flex items-center gap-2 uppercase tracking-widest">
                <LayoutGrid className="text-[#8b2e2e]" size={20} />
                Configuration des Attributs
            </h3>

            {/* Quick Slots (Presets) */}
            <div className="mb-8">
                <h4 className="font-bold text-[10px] text-[#bfae85] mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <Zap size={14} className="text-amber-500" /> Emplacements Rapides (Préréglages)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ATTRIBUTE_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            onClick={() => requestPresetLoad(preset)}
                            className="bg-[#fdfbf7] border border-[#bfae85]/30 hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-md rounded-sm p-3 text-left transition group flex items-start gap-3"
                        >
                            <div className="bg-white p-2 rounded-full border border-[#bfae85]/20 group-hover:border-amber-400 group-hover:text-amber-700 text-[#bfae85]/50">
                                <Play size={14} className="ml-0.5" />
                            </div>
                            <div>
                                <span className="block font-bold text-[#5c4d41] text-xs group-hover:text-amber-900">{preset.name}</span>
                                <span className="block text-[10px] text-[#5c4d41]/60 italic">{preset.description}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Option Secondary Attributes */}
            <div className="mb-8 p-4 bg-[#8b2e2e]/5 border border-[#8b2e2e]/20 rounded-sm flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-[#8b2e2e] text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <CheckSquare size={16} /> Attributs Secondaires
                    </h4>
                    <p className="text-[10px] text-[#5c4d41]/70 mt-1 italic leading-tight">
                        Active 2 attributs supplémentaires par pavé pour les calculs dérivés ou jauges spéciales.
                    </p>
                </div>
                <button
                    onClick={toggleSecondaryAttributes}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${data.secondaryAttributesActive ? 'bg-[#8b2e2e]' : 'bg-stone-300'}`}
                >
                    <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${data.secondaryAttributesActive ? 'translate-x-6' : ''}`} />
                </button>
            </div>

            {/* Global Settings (Cats & Attrs Count) */}
            <div className="mb-8 bg-[#bfae85]/5 p-4 rounded-sm border border-[#bfae85]/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Category Count */}
                <div className="flex flex-col gap-2">
                    <span className="font-bold text-[#5c4d41]/80 uppercase text-[10px] tracking-widest">Nombre de pavés :</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(n => (
                            <button
                                key={n}
                                onClick={() => handleCategoryCountChange(n)}
                                className={`w-10 h-10 rounded-full font-black text-base transition ${count === n
                                    ? 'bg-[#8b2e2e] text-white shadow-lg ring-2 ring-[#8b2e2e]/20 scale-110'
                                    : 'bg-white border border-[#bfae85]/30 text-[#5c4d41]/50 hover:bg-[#8b2e2e]/5 hover:text-[#8b2e2e]'
                                    }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Attributes Count (Global) */}
                <div className="flex flex-col gap-2">
                    <span className="font-bold text-[#5c4d41]/80 uppercase text-[10px] tracking-widest">Attributs par pavé :</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                onClick={() => handleGlobalAttributeCountChange(n)}
                                className={`w-10 h-10 rounded-full font-black text-base transition ${globalAttrCount === n
                                    ? 'bg-[#8b2e2e] text-white shadow-lg ring-2 ring-[#8b2e2e]/20 scale-110'
                                    : 'bg-white border border-[#bfae85]/30 text-[#5c4d41]/50 hover:bg-[#8b2e2e]/5 hover:text-[#8b2e2e]'
                                    }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Attribute Cost */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="attr-xp-cost" className="block text-[10px] font-bold text-[#5c4d41]/80 uppercase tracking-widest">Coût XP</label>
                    <div className="flex items-center gap-2">
                        <input
                            id="attr-xp-cost"
                            type="number"
                            value={data.creationConfig.attributeCost ?? 6}
                            onChange={(e) => updateAttributeCost(parseInt(e.target.value) || 0)}
                            className="w-20 border border-[#bfae85]/40 rounded-sm px-3 py-1.5 focus:border-[#8b2e2e] outline-none font-bold"
                        />
                        <div title="Coût en expérience pour augmenter un attribut de 1 point (Défaut: 6)" className="text-[10px] text-[#5c4d41]/60 italic flex items-center gap-1">
                            <Info size={14} className="text-[#bfae85]" />
                            <span>/ point</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Cards Grid */}
            <div className={`grid gap-4 grid-cols-1 md:grid-cols-${count}`}>
                {categories.map((cat, idx) => {
                    const attrs = data.attributes[cat.id] || [];
                    const secondaryAttrs = data.secondaryAttributesActive ? (data.secondaryAttributes[cat.id] || []) : [];

                    return (
                        <div key={cat.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
                            <div className="bg-slate-100 p-3 border-b border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                                    Pavé {idx + 1}
                                </label>
                                <input
                                    value={cat.label}
                                    onChange={(e) => updateCategoryLabel(cat.id, e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full font-bold text-lg bg-white border border-gray-300 rounded px-2 py-1 shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 transition"
                                    placeholder="Nom du pavé"
                                />
                            </div>

                            <div className="p-3 space-y-2 flex-grow bg-slate-50/50">
                                {attrs.map((attr, aIdx) => (
                                    <div key={attr.id} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 w-4 font-mono select-none">{aIdx + 1}</span>
                                        <input
                                            value={attr.name}
                                            onChange={(e) => updateAttributeName(cat.id, attr.id, e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            className="flex-grow text-sm border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none bg-white shadow-sm font-medium text-gray-800"
                                            placeholder={`Attribut ${aIdx + 1}`}
                                        />
                                    </div>
                                ))}

                                {data.secondaryAttributesActive && secondaryAttrs.length > 0 && (
                                    <>
                                        <hr className="my-3 border-dashed border-gray-300" />
                                        <div className="text-[10px] text-gray-400 font-bold uppercase text-center mb-2 tracking-wide">Secondaires</div>
                                        {secondaryAttrs.map((sAttr, sIdx) => (
                                            <div key={sAttr.id} className="flex items-center gap-2">
                                                <span className="text-xs text-purple-400 w-4 font-mono select-none">+{sIdx + 1}</span>
                                                <input
                                                    value={sAttr.name}
                                                    onChange={(e) => updateSecondaryAttributeName(cat.id, sIdx, e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    className="flex-grow text-sm border border-purple-200 rounded px-2 py-1 focus:border-purple-500 outline-none bg-white shadow-sm font-medium text-gray-800"
                                                    placeholder={`Attr. Secondaire ${sIdx + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preset Confirmation Modal */}
            {showPresetConfirm && pendingPreset && (
                <ThematicModal
                    isOpen={showPresetConfirm}
                    onClose={() => { setShowPresetConfirm(false); setPendingPreset(null); }}
                    title="Charger le préréglage ?"
                    icon={<Zap size={24} className="text-amber-600" />}
                    size="md"
                    footer={
                        <>
                            <button onClick={() => { setShowPresetConfirm(false); setPendingPreset(null); }} className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold">Annuler</button>
                            <button onClick={executePresetLoad} className="px-6 py-2 bg-[#8b2e2e] text-white rounded-sm font-bold shadow-md hover:bg-[#6a2424]">
                                Confirmer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col items-center text-center space-y-4 py-4">
                        <div className="bg-amber-50/50 p-4 rounded-sm border border-[#bfae85]/30 w-full">
                            <span className="block font-black text-[#8b2e2e] uppercase tracking-widest text-sm mb-1">{pendingPreset.name}</span>
                            <span className="text-[10px] text-[#5c4d41]/70 italic">{pendingPreset.description}</span>
                        </div>
                        <p className="text-xs text-[#5c4d41] leading-relaxed">
                            Cette action remplacera <span className="font-bold underline">toute</span> votre configuration d'attributs actuelle.
                        </p>
                        <div className="bg-red-50/50 border border-red-200/50 p-2 rounded-sm w-full">
                            <p className="text-[10px] text-red-800/80 italic font-bold">Les noms et scores actuels seront perdus.</p>
                        </div>
                    </div>
                </ThematicModal>
            )}
        </div>
    );
};

export default AttributesEditor;
