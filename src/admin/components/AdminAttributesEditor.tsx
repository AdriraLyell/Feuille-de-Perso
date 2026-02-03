import React, { useState } from 'react';
import { RulesData } from '../../types/rules';
import { Plus, Trash2, Shield, Zap, LayoutGrid, Play, Info } from 'lucide-react';
import ThematicModal from '../../components/ui/ThematicModal';

interface AdminAttributesEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
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

const AdminAttributesEditor: React.FC<AdminAttributesEditorProps> = ({ rules, onUpdate }) => {
    const definitions = rules.definitions;
    const attributesMap = definitions.attributes;
    const secondaryMap = definitions.secondaryAttributes || {};
    const labelsMap = definitions.labels || {};

    const [pendingPreset, setPendingPreset] = useState<any>(null);
    const [showPresetConfirm, setShowPresetConfirm] = useState(false);

    // Dynamic categories based on keys in attributesMap
    const categories = Object.keys(attributesMap);

    // --- PRESETS ---
    const requestPresetLoad = (preset: typeof ATTRIBUTE_PRESETS[0]) => {
        setPendingPreset(preset);
        setShowPresetConfirm(true);
    };

    const executePresetLoad = () => {
        if (!pendingPreset) return;

        const newAttributes: Record<string, string[]> = {};
        const newLabels: Record<string, string> = { ...labelsMap };
        // Preserve existing secondary attributes
        const newSecondary: Record<string, string[]> = { ...secondaryMap };

        pendingPreset.structure.forEach((cat: any) => {
            newAttributes[cat.id] = [...cat.attrs];
            newLabels[cat.id] = cat.label;
        });

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                attributes: newAttributes,
                secondaryAttributes: newSecondary,
                labels: newLabels
            }
        });

        setShowPresetConfirm(false);
        setPendingPreset(null);
    };

    // --- MANAGE CATEGORIES ---
    const addCategory = () => {
        const count = categories.length;
        const potentialIds = ['physique', 'mental', 'social', 'mystique', 'spirituel', 'martial'];
        let nextId = potentialIds[count] || `cat_${count + 1}`;

        // Ensure uniqueness
        if (categories.includes(nextId)) {
            nextId = `cat_${count + 1}_${Math.random().toString(36).substr(2, 3)}`;
        }

        // Default attributes for this ID if known
        const defaults = DEFAULT_ATTRIBUTES[nextId] || ['Attribut 1', 'Attribut 2', 'Attribut 3', 'Attribut 4'];

        // Default Secondary if active
        const isSecondaryActive = !!rules.configurations.global.secondaryAttributes;
        const newSecondaryMap = { ...secondaryMap };
        if (isSecondaryActive) {
            newSecondaryMap[nextId] = ["Secondaire 1", "Secondaire 2"];
        }

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                attributes: {
                    ...attributesMap,
                    [nextId]: defaults
                },
                secondaryAttributes: newSecondaryMap,
                labels: {
                    ...labelsMap,
                    [nextId]: nextId.charAt(0).toUpperCase() + nextId.slice(1)
                }
            }
        });
    };

    const removeCategory = (categoryId: string) => {
        const newAttributes = { ...attributesMap };
        delete newAttributes[categoryId];

        const newSecondary = { ...secondaryMap };
        delete newSecondary[categoryId];

        const newLabels = { ...labelsMap };
        delete newLabels[categoryId];

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                attributes: newAttributes,
                secondaryAttributes: newSecondary,
                labels: newLabels
            }
        });
    };

    const toggleSecondaryGlobal = () => {
        const isActive = !!rules.configurations.global.secondaryAttributes;
        const newActive = !isActive;

        // Ensure we have 2 empty slots for every category if activating
        const newSecondary = { ...secondaryMap };
        if (newActive) {
            Object.keys(attributesMap).forEach(cat => {
                if (!newSecondary[cat] || newSecondary[cat].length !== 2) {
                    const existing = newSecondary[cat] || [];
                    newSecondary[cat] = [
                        existing[0] || "Secondaire 1",
                        existing[1] || "Secondaire 2"
                    ];
                }
            });
        }

        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                global: {
                    ...rules.configurations.global,
                    secondaryAttributes: newActive
                }
            },
            definitions: {
                ...rules.definitions,
                secondaryAttributes: newSecondary
            }
        });
    };

    const updateSecondaryItemName = (category: string, index: number, newName: string) => {
        const currentList = secondaryMap[category] || ["Secondaire 1", "Secondaire 2"];
        const newList = [...currentList];
        newList[index] = newName;

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                secondaryAttributes: {
                    ...secondaryMap,
                    [category]: newList
                }
            }
        });
    };

    const updateLabel = (category: string, newLabel: string) => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                labels: {
                    ...rules.definitions.labels,
                    [category]: newLabel
                }
            }
        });
    };

    // Removed individual addItem/removeItem functions for attributes as we now use Global Symmetry

    const updateItemName = (category: string, index: number, newName: string) => {
        const currentList = attributesMap[category] || [];
        const newList = [...currentList];
        newList[index] = newName;

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                attributes: {
                    ...rules.definitions.attributes,
                    [category]: newList
                }
            }
        });
    };

    const renderColumn = (category: string) => {
        const primaryList = attributesMap[category] || [];
        const isSecondaryActive = !!rules.configurations.global.secondaryAttributes;
        const secondaryList = secondaryMap[category] || ["Secondaire 1", "Secondaire 2"];
        const label = labelsMap[category] || category.charAt(0).toUpperCase() + category.slice(1);

        return (
            <div key={category} className="bg-white p-4 rounded shadow-sm border border-slate-200 flex flex-col h-full relative group/col">
                <button
                    onClick={() => removeCategory(category)}
                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/col:opacity-100 transition-opacity"
                    title="Supprimer ce pavé"
                >
                    <Trash2 size={16} />
                </button>

                {/* Header with Editable Label */}
                <div className="mb-4 border-b border-slate-200 pb-2 pr-6">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">ID: {category}</label>
                    <input
                        value={label}
                        onChange={(e) => updateLabel(category, e.target.value)}
                        className="font-bold text-lg bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none w-full text-slate-800"
                    />
                </div>

                {/* Primary Attributes */}
                <div className="mb-6 flex-grow">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1"><Shield size={12} /> Primaires</h4>
                        {/* No Individual Add Button */}
                    </div>
                    <div className="space-y-1">
                        {primaryList.map((name, index) => (
                            <div key={`prim-${index}`} className="flex items-center gap-2 group">
                                <span className="text-[10px] text-slate-300 w-4 select-none">{index + 1}</span>
                                <input
                                    value={name}
                                    onChange={(e) => updateItemName(category, index, e.target.value)}
                                    className="flex-grow text-sm font-medium border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-1 py-0.5 outline-none bg-transparent focus:bg-white transition-all"
                                />
                                {/* No Individual Remove Button - Use Global Count */}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Secondary Attributes (Global Toggle) */}
                {isSecondaryActive && (
                    <div className={`pt-4 border-t border-slate-100 bg-slate-50 -mx-4 px-4 pb-2 rounded-b sticky bottom-0 animate-in slide-in-from-bottom-2`}>
                        <div className="flex items-center justify-between mb-2 pt-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Zap size={12} /> Secondaires</h4>
                        </div>
                        <div className="space-y-1">
                            {[0, 1].map((index) => (
                                <div key={`sec-${index}`} className="flex items-center gap-2 group">
                                    <span className="text-[10px] text-slate-300 w-4 select-none">+{index + 1}</span>
                                    <input
                                        value={secondaryList[index] || ""}
                                        onChange={(e) => updateSecondaryItemName(category, index, e.target.value)}
                                        className="flex-grow text-xs text-slate-600 border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 outline-none bg-transparent focus:bg-white transition-all"
                                        placeholder={`Secondaire ${index + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">

            {/* PRESETS SECTION & OPTIONS */}
            <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2">
                    <Zap size={16} className="text-amber-500" /> Options & Préréglages
                </h4>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Global Options */}
                    <div className="w-full md:w-1/3 space-y-4">
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
                            <div>
                                <h5 className="text-xs font-bold text-slate-700">Attributs Secondaires</h5>
                                <p className="text-[10px] text-slate-500 italic">Active 2 attributs supplémentaires par pavé.</p>
                            </div>
                            <button
                                onClick={toggleSecondaryGlobal}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ${rules.configurations.global.secondaryAttributes ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-200 ${rules.configurations.global.secondaryAttributes ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="w-full md:w-2/3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ATTRIBUTE_PRESETS.map((preset, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => requestPresetLoad(preset)}
                                    className="bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded p-3 text-left transition-all group flex items-start gap-3"
                                >
                                    <div className="bg-white p-2 rounded-full border border-slate-200 group-hover:border-amber-400 group-hover:text-amber-700 text-slate-300">
                                        <Play size={14} className="ml-0.5" />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-slate-700 text-xs group-hover:text-amber-900">{preset.name}</span>
                                        <span className="block text-[10px] text-slate-500 italic">{preset.desc}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* COLUMNS SECTION */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700 uppercase tracking-widest text-sm flex items-center gap-2">
                        <LayoutGrid size={18} className="text-blue-600" /> Structure ({categories.length} / 4 Pavés)
                    </h3>
                    <button
                        onClick={addCategory}
                        disabled={categories.length >= 4}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${categories.length >= 4
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                    >
                        <Plus size={14} /> Ajouter un Pavé
                    </button>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${Math.min(categories.length, 4)} gap-6`}>
                    {categories.map(cat => renderColumn(cat))}
                </div>
            </div>

            {/* CONFIRM MODAL */}
            {showPresetConfirm && pendingPreset && (
                <ThematicModal
                    isOpen={showPresetConfirm}
                    onClose={() => { setShowPresetConfirm(false); setPendingPreset(null); }}
                    title="Charger le préréglage ?"
                    icon={<Zap size={24} className="text-amber-600" />}
                    size="md"
                    footer={
                        <>
                            <button onClick={() => { setShowPresetConfirm(false); setPendingPreset(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-bold">Annuler</button>
                            <button onClick={executePresetLoad} className="px-6 py-2 bg-amber-600 text-white rounded font-bold shadow hover:bg-amber-700">
                                Confirmer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col items-center text-center space-y-4 py-4">
                        <p className="text-sm text-slate-600">
                            Cette action remplacera <span className="font-bold text-red-600">toute</span> votre configuration d'attributs actuelle par le modèle :
                        </p>
                        <div className="bg-amber-50 p-2 rounded border border-amber-200 font-bold text-amber-900">
                            {pendingPreset.name}
                        </div>
                        <p className="text-xs text-slate-400 italic">Les noms et scores actuels seront perdus.</p>
                    </div>
                </ThematicModal>
            )}
        </div>
    );
};

export default AdminAttributesEditor;

