
import React, { useState } from 'react';
import { CharacterSheetData } from '../../types';
import { Zap, Play, CheckSquare, Info, LayoutGrid } from 'lucide-react';

interface AttributesEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

const DEFAULT_ATTRIBUTES: Record<string, string[]> = {
    'physique': ['Force', 'Constitution', 'Agilité', 'Dextérité', 'Perception'],
    'mental': ['Volonté', 'Stabilité', 'Astuce/Subtilité', 'Intellect', 'Intuition'],
    'social': ['Charisme', 'Calme', 'Mimétisme', 'Communication', 'Empathie'],
    'mystique': ['Puissance', 'Résistance', 'Souplesse', 'Précision', 'Sensibilité']
};

const ATTRIBUTE_PRESETS = [
    {
        name: "Standard (Classique)",
        desc: "3 Pavés de 4 Attributs",
        structure: [
            { id: 'physique', label: 'Physique', attrs: ['Force', 'Constitution', 'Dextérité', 'Agilité'] },
            { id: 'mental', label: 'Mental', attrs: ['Intellect', 'Volonté', 'Intuition', 'Perception'] },
            { id: 'social', label: 'Social', attrs: ['Charisme', 'Empathie', 'Apparence', 'Communication'] }
        ]
    },
    {
        name: "Complet (Mystique)",
        desc: "4 Pavés de 5 Attributs",
        structure: [
            { id: 'physique', label: 'Physique', attrs: ['Force', 'Constitution', 'Agilité', 'Dextérité', 'Perception'] },
            { id: 'mental', label: 'Mental', attrs: ['Volonté', 'Stabilité', 'Astuce/Subtilité', 'Intellect', 'Intuition'] },
            { id: 'social', label: 'Social', attrs: ['Charisme', 'Calme', 'Mimétisme', 'Communication', 'Empathie'] },
            { id: 'mystique', label: 'Mystique', attrs: ['Puissance', 'Résistance', 'Souplesse', 'Précision', 'Sensibilité'] }
        ]
    }
];

const AttributesEditor: React.FC<AttributesEditorProps> = ({ data, onUpdate, onAddLog }) => {
    const [pendingPreset, setPendingPreset] = useState<any>(null);
    const [showPresetConfirm, setShowPresetConfirm] = useState(false);

    const categories = data.attributeSettings || [];
    const count = categories.length;
    
    // Find global attribute count from the first category
    const firstCatId = categories[0]?.id;
    const globalAttrCount = firstCatId && data.attributes[firstCatId] 
        ? data.attributes[firstCatId].length 
        : 4;

    // --- LOGIC ---

    const requestPresetLoad = (preset: typeof ATTRIBUTE_PRESETS[0]) => {
        setPendingPreset(preset);
        setShowPresetConfirm(true);
    };

    const executePresetLoad = () => {
        if (!pendingPreset) return;

        const newSettings: any[] = [];
        const newAttributes: any = {};

        pendingPreset.structure.forEach((cat: any) => {
            newSettings.push({ id: cat.id, label: cat.label });
            newAttributes[cat.id] = cat.attrs.map((name: string) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: name,
                val1: "", val2: "", val3: "",
                creationVal1: 0, creationVal2: 0, creationVal3: 0
            }));
        });

        onUpdate({
            ...data,
            attributeSettings: newSettings,
            attributes: newAttributes
        });
        
        onAddLog(`Préréglage attributs appliqué : ${pendingPreset.name}`, 'success', 'settings');
        setShowPresetConfirm(false);
        setPendingPreset(null);
    };

    const handleCategoryCountChange = (newCount: number) => {
        const defaultDefs = [
            { id: 'physique', label: 'Physique' },
            { id: 'mental', label: 'Mental' },
            { id: 'social', label: 'Social' },
            { id: 'mystique', label: 'Mystique' }
        ];

        const currentDefs = [...data.attributeSettings];
        const currentAttributes = { ...data.attributes };
        
        const firstCat = currentDefs[0]?.id;
        const currentAttrCount = firstCat && currentAttributes[firstCat] ? currentAttributes[firstCat].length : 4;

        if (newCount > currentDefs.length) {
            for (let i = currentDefs.length; i < newCount; i++) {
                let defToAdd = defaultDefs[i];
                if (!defToAdd) {
                    defToAdd = { id: `cat_${i+1}`, label: `Pavé ${i+1}` };
                }
                
                if (currentDefs.some(d => d.id === defToAdd.id)) {
                     defToAdd = { ...defToAdd, id: `${defToAdd.id}_${Math.random().toString(36).substr(2, 4)}` };
                }
                currentDefs.push(defToAdd);
                
                currentAttributes[defToAdd.id] = Array(currentAttrCount).fill(null).map((_, idx) => {
                    let attrName = `Attribut ${idx + 1}`;
                    const baseId = defToAdd.id.split('_')[0];
                    if (DEFAULT_ATTRIBUTES[baseId] && DEFAULT_ATTRIBUTES[baseId][idx]) {
                        attrName = DEFAULT_ATTRIBUTES[baseId][idx];
                    }

                    return {
                      id: Math.random().toString(36).substr(2, 9),
                      name: attrName,
                      val1: "", val2: "", val3: ""
                    };
                });
            }
        } else if (newCount < currentDefs.length) {
            const removed = currentDefs.splice(newCount);
            removed.forEach(def => {
                delete currentAttributes[def.id];
            });
        }

        onUpdate({
            ...data,
            attributeSettings: currentDefs,
            attributes: currentAttributes
        });
    };

    const handleGlobalAttributeCountChange = (newCount: number) => {
        const newAttributes = { ...data.attributes };
        
        Object.keys(newAttributes).forEach(catId => {
            const attrs = [...(newAttributes[catId] || [])];
            if (newCount > attrs.length) {
                const diff = newCount - attrs.length;
                for (let i = 0; i < diff; i++) {
                    const idx = attrs.length;
                    let attrName = `Attribut ${idx + 1}`;
                    const baseId = catId.split('_')[0];
                    if (DEFAULT_ATTRIBUTES[baseId] && DEFAULT_ATTRIBUTES[baseId][idx]) {
                        attrName = DEFAULT_ATTRIBUTES[baseId][idx];
                    }

                    attrs.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: attrName,
                        val1: "", val2: "", val3: ""
                    });
                }
            } else if (newCount < attrs.length) {
                attrs.splice(newCount);
            }
            newAttributes[catId] = attrs;
        });

        onUpdate({
            ...data,
            attributes: newAttributes
        });
    };

    const updateCategoryLabel = (id: string, label: string) => {
        const newSettings = data.attributeSettings.map(def => 
            def.id === id ? { ...def, label } : def
        );
        onUpdate({ ...data, attributeSettings: newSettings });
    };

    const updateAttributeName = (catId: string, attrId: string, name: string) => {
        const catAttrs = data.attributes[catId];
        if (!catAttrs) return;

        const newAttrs = catAttrs.map(attr => 
            attr.id === attrId ? { ...attr, name } : attr
        );
        onUpdate({
            ...data,
            attributes: {
                ...data.attributes,
                [catId]: newAttrs
            }
        });
    };

    const toggleSecondaryAttributes = () => {
        const isActive = !data.secondaryAttributesActive;
        let newSecondary = { ...data.secondaryAttributes };
        
        if (isActive) {
            data.attributeSettings.forEach(cat => {
                if (!newSecondary[cat.id]) {
                    newSecondary[cat.id] = [
                        { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 1', val1: "", val2: "", val3: "" },
                        { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 2', val1: "", val2: "", val3: "" }
                    ];
                }
            });
        }

        onUpdate({
            ...data,
            secondaryAttributesActive: isActive,
            secondaryAttributes: newSecondary
        });
    };

    const updateSecondaryAttributeName = (catId: string, index: number, name: string) => {
        const newSecAttrs = [...(data.secondaryAttributes[catId] || [])];
        if (newSecAttrs[index]) {
            newSecAttrs[index] = { ...newSecAttrs[index], name };
            onUpdate({
                ...data,
                secondaryAttributes: {
                    ...data.secondaryAttributes,
                    [catId]: newSecAttrs
                }
            });
        }
    };

    const updateAttributeCost = (cost: number) => {
        onUpdate({
            ...data,
            creationConfig: {
                ...data.creationConfig,
                attributeCost: cost
            }
        });
    };

    // --- RENDER ---

    return (
        <div className="bg-white p-6 rounded shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
             <h3 className="font-bold text-lg mb-6 text-gray-800 border-b pb-4 flex items-center gap-2">
                <LayoutGrid className="text-blue-600" />
                Configuration des Attributs
            </h3>

            {/* Quick Slots (Presets) */}
            <div className="mb-8">
                <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-500" /> Emplacements Rapides (Préréglages)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ATTRIBUTE_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            onClick={() => requestPresetLoad(preset)}
                            className="bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md rounded-lg p-3 text-left transition-all group flex items-start gap-3"
                        >
                            <div className="bg-white p-2 rounded-full border border-gray-200 group-hover:border-blue-200 group-hover:text-blue-600 text-gray-400">
                                <Play size={16} className="ml-0.5" />
                            </div>
                            <div>
                                <span className="block font-bold text-gray-800 text-sm group-hover:text-blue-700">{preset.name}</span>
                                <span className="block text-xs text-gray-500">{preset.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Option Secondary Attributes */}
            <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-purple-800 text-sm flex items-center gap-2">
                        <CheckSquare size={16} /> Attributs Secondaires Optionnels
                    </h4>
                    <p className="text-xs text-purple-600 mt-1">
                        Active 2 attributs supplémentaires par pavé, séparés par une ligne de démarcation.
                    </p>
                </div>
                <button
                    onClick={toggleSecondaryAttributes}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${data.secondaryAttributesActive ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                    <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${data.secondaryAttributesActive ? 'translate-x-6' : ''}`} />
                </button>
            </div>

            {/* Global Settings (Cats & Attrs Count) */}
            <div className="mb-8 bg-gray-50 p-4 rounded border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Category Count */}
                <div className="flex flex-col gap-2">
                    <span className="font-bold text-gray-700 text-sm">Nombre de pavés :</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(n => (
                            <button
                                key={n}
                                onClick={() => handleCategoryCountChange(n)}
                                className={`w-10 h-10 rounded-full font-bold text-lg transition-all ${
                                    count === n 
                                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 scale-110' 
                                    : 'bg-white border border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Attributes Count (Global) */}
                <div className="flex flex-col gap-2">
                    <span className="font-bold text-gray-700 text-sm">Nombre d'attributs (par pavé) :</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                onClick={() => handleGlobalAttributeCountChange(n)}
                                className={`w-10 h-10 rounded-full font-bold text-lg transition-all ${
                                    globalAttrCount === n 
                                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 scale-110' 
                                    : 'bg-white border border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Attribute Cost */}
                <div className="flex flex-col gap-2">
                    <label className="block text-sm font-bold text-gray-700">Coût XP (Attributs)</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={data.creationConfig.attributeCost ?? 6}
                            onChange={(e) => updateAttributeCost(parseInt(e.target.value) || 0)}
                            className="w-20 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div title="Coût en expérience pour augmenter un attribut de 1 point (Défaut: 6)" className="text-xs text-gray-500 italic flex items-center gap-1">
                            <Info size={14} className="text-blue-400" />
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
                                    className="w-full font-bold text-lg bg-white border border-gray-300 rounded px-2 py-1 shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 transition-all"
                                    placeholder="Nom du pavé"
                                 />
                             </div>

                             <div className="p-3 space-y-2 flex-grow bg-slate-50/50">
                                 {attrs.map((attr, aIdx) => (
                                     <div key={attr.id} className="flex items-center gap-2">
                                         <span className="text-xs text-gray-400 w-4 font-mono select-none">{aIdx+1}</span>
                                         <input 
                                            value={attr.name}
                                            onChange={(e) => updateAttributeName(cat.id, attr.id, e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            className="flex-grow text-sm border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none bg-white shadow-sm font-medium text-gray-800"
                                            placeholder={`Attribut ${aIdx+1}`}
                                         />
                                     </div>
                                 ))}

                                 {data.secondaryAttributesActive && secondaryAttrs.length > 0 && (
                                     <>
                                        <hr className="my-3 border-dashed border-gray-300" />
                                        <div className="text-[10px] text-gray-400 font-bold uppercase text-center mb-2 tracking-wide">Secondaires</div>
                                        {secondaryAttrs.map((sAttr, sIdx) => (
                                            <div key={sAttr.id} className="flex items-center gap-2">
                                                <span className="text-xs text-purple-400 w-4 font-mono select-none">+{sIdx+1}</span>
                                                <input 
                                                    value={sAttr.name}
                                                    onChange={(e) => updateSecondaryAttributeName(cat.id, sIdx, e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    className="flex-grow text-sm border border-purple-200 rounded px-2 py-1 focus:border-purple-500 outline-none bg-white shadow-sm font-medium text-gray-800"
                                                    placeholder={`Attr. Secondaire ${sIdx+1}`}
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
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                        <div className="bg-yellow-50 p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-yellow-700">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Charger le préréglage ?</h3>
                            <div className="bg-white p-3 rounded border border-yellow-200 shadow-sm w-full mb-4">
                                <span className="block font-bold text-gray-800">{pendingPreset.name}</span>
                                <span className="text-xs text-gray-500">{pendingPreset.desc}</span>
                            </div>
                            <p className="text-gray-600 text-sm">
                                Cette action va remplacer <span className="font-bold">toute</span> votre configuration d'attributs actuelle.
                                <span className="font-bold text-red-600 mt-2 block">Les valeurs d'attributs existantes seront perdues.</span>
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                            <button 
                                onClick={() => { setShowPresetConfirm(false); setPendingPreset(null); }} 
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={executePresetLoad} 
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium shadow-sm transition-colors"
                            >
                                Confirmer le chargement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttributesEditor;
