import React, { useState, useEffect } from 'react';
import { RulesData } from '../../types/rules';
import { AttributePreset } from '../../types/system';
import { Plus, Trash2, Shield, Zap, LayoutGrid, Play, Info, Save, Loader2 } from 'lucide-react';
import { AdminService } from '../../services/AdminService';
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

const DEFAULT_SECONDARY_ATTRIBUTES: Record<string, string[]> = {
    'physique': ['Corpulence', 'Beauté'],
    'social': ['Présence', 'Charme'],
    'mental': ['Conscience', 'Attraction'],
    'mystique': ['Aura', 'Fascination']
};

const ATTRIBUTE_PRESETS = [
    {
        name: "v2 (Classique)",
        desc: "3 Pavés de 4 Attributs",
        hasSecondary: false,
        structure: [
            { id: 'pave_attributs_1', label: 'Physique', attrs: ['Force', 'Constitution', 'Dextérité', 'Agilité'], secondaryAttrs: ['Corpulence', 'Beauté'] },
            { id: 'pave_attributs_2', label: 'Mental', attrs: ['Intellect', 'Volonté', 'Intuition', 'Perception'], secondaryAttrs: ['Conscience', 'Attraction'] },
            { id: 'pave_attributs_3', label: 'Social', attrs: ['Charisme', 'Empathie', 'Apparence', 'Communication'], secondaryAttrs: ['Présence', 'Charme'] }
        ]
    },
    {
        name: "v4 (Complet)",
        desc: "4 Pavés de 5 Attributs",
        hasSecondary: true,
        structure: [
            { id: 'pave_attributs_1', label: 'Physique', attrs: ['Force', 'Constitution', 'Agilité', 'Dextérité', 'Perception'], secondaryAttrs: ['Corpulence', 'Beauté'] },
            { id: 'pave_attributs_2', label: 'Mental', attrs: ['Volonté', 'Stabilité', 'Astuce/Subtilité', 'Intellect', 'Intuition'], secondaryAttrs: ['Conscience', 'Attraction'] },
            { id: 'pave_attributs_3', label: 'Social', attrs: ['Charisme', 'Calme', 'Mimétisme', 'Communication', 'Empathie'], secondaryAttrs: ['Présence', 'Charme'] },
            { id: 'pave_attributs_4', label: 'Mystique', attrs: ['Puissance', 'Résistance', 'Souplesse', 'Précision', 'Sensibilité'], secondaryAttrs: ['Aura', 'Fascination'] }
        ]
    }
];

const getDefaultSecondaryAttrs = (label: string, id: string): string[] => {
    const l = label.toLowerCase();
    const i = id.toLowerCase();
    for (const key of Object.keys(DEFAULT_SECONDARY_ATTRIBUTES)) {
        if (l.includes(key) || i.includes(key)) {
            return [...DEFAULT_SECONDARY_ATTRIBUTES[key]];
        }
    }
    return ["Secondaire 1", "Secondaire 2"];
};

const AdminAttributesEditor: React.FC<AdminAttributesEditorProps> = ({ rules, onUpdate }) => {
    const definitions = rules.definitions;
    const attributesMap = definitions.attributes;
    const secondaryMap = definitions.secondaryAttributes || {};
    const labelsMap = definitions.labels || {};

    const [pendingPreset, setPendingPreset] = useState<any>(null);
    const [showPresetConfirm, setShowPresetConfirm] = useState(false);

    // DB Presets State
    const [dbPresets, setDbPresets] = useState<AttributePreset[]>([]);
    const [isLoadingPresets, setIsLoadingPresets] = useState(true);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");
    const [newPresetDesc, setNewPresetDesc] = useState("");

    useEffect(() => {
        loadDBPresets();
    }, []);

    const loadDBPresets = async () => {
        setIsLoadingPresets(true);
        const data = await AdminService.listAttributePresets();
        if (data) setDbPresets(data);
        setIsLoadingPresets(false);
    };

    // Dynamic categories based on keys in attributesMap, sorted by standard order
    const STANDARD_ORDER = ['pave_attributs_1', 'pave_attributs_2', 'pave_attributs_3', 'pave_attributs_4', 'pave_attributs_5'];
    const categories = Object.keys(attributesMap).sort((a, b) => {
        const indexA = STANDARD_ORDER.indexOf(a);
        const indexB = STANDARD_ORDER.indexOf(b);

        // If both are standard, sort by standard order
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;

        // If one is standard, it comes first
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // Otherwise sort alphabetically
        return a.localeCompare(b);
    });

    // --- PRESETS ---
    const requestPresetLoad = (preset: any) => {
        // Normalize preset structure for hardcoded presets
        if (preset.structure && !preset.structure[0].secondaryAttrs && preset.structure[0].attrs) {
            preset.structure = preset.structure.map((cat: any) => ({
                ...cat,
                secondaryAttrs: [] // Hardcoded presets don't have secondary attrs
            }));
        }
        setPendingPreset(preset);
        setShowPresetConfirm(true);
    };

    const handleSaveCurrentAsPreset = async () => {
        if (!newPresetName.trim()) return;

        // Structure current attributes for the preset
        const structure = categories.map(cat => ({
            id: cat,
            label: labelsMap[cat] || cat,
            attrs: [...attributesMap[cat]],
            secondaryAttrs: rules.configurations.global.secondaryAttributes ? [...(secondaryMap[cat] || [])] : []
        }));

        const isSecondaryActive = !!rules.configurations.global.secondaryAttributes;
        const success = await AdminService.saveAttributePreset(newPresetName, newPresetDesc, structure, isSecondaryActive);
        if (success) {
            setIsSaveModalOpen(false);
            setNewPresetName("");
            setNewPresetDesc("");
            loadDBPresets(); // Refresh
        }
    };

    const handleDeletePreset = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Supprimer ce préréglage ?")) return;
        const success = await AdminService.deleteAttributePreset(id);
        if (success) loadDBPresets();
    };

    const executePresetLoad = () => {
        if (!pendingPreset) return;

        const newAttributes: Record<string, string[]> = {};
        const newLabels: Record<string, string> = { ...labelsMap };
        // Preserve existing or load from preset
        const newSecondary: Record<string, string[]> = { ...secondaryMap };

        const hasSecondaryInPreset = pendingPreset.has_secondary || pendingPreset.hasSecondary || false;

        pendingPreset.structure.forEach((cat: any) => {
            newAttributes[cat.id] = [...cat.attrs];
            newLabels[cat.id] = cat.label;
            if (cat.secondaryAttrs) {
                newSecondary[cat.id] = [...cat.secondaryAttrs];
            }
        });

        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                global: {
                    ...rules.configurations.global,
                    secondaryAttributes: hasSecondaryInPreset
                }
            },
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
        let nextId = `pave_attributs_${count + 1}`;

        // Ensure uniqueness
        if (categories.includes(nextId)) {
            nextId = `pave_attributs_${count + 1}_${Math.random().toString(36).substr(2, 3)}`;
        }

        // ALL categories must have the same number of attributes.
        // We take the count from the first existing category.
        const firstCatId = categories[0];
        const attributeCount = firstCatId ? (attributesMap[firstCatId]?.length || 0) : 4;

        // Default attributes for this ID if known
        let defaults = DEFAULT_ATTRIBUTES[nextId] || [];
        // Adjust defaults to match current global count
        if (defaults.length < attributeCount) {
            const extra = Array(attributeCount - defaults.length).fill(0).map((_, i) => `Attribut ${defaults.length + i + 1}`);
            defaults = [...defaults, ...extra];
        } else if (defaults.length > attributeCount) {
            defaults = defaults.slice(0, attributeCount);
        }

        // If no default known at all
        if (defaults.length === 0) {
            defaults = Array(attributeCount).fill(0).map((_, i) => `Attribut ${i + 1}`);
        }

        // Default Secondary if active
        const isSecondaryActive = !!rules.configurations.global.secondaryAttributes;
        const newSecondaryMap = { ...secondaryMap };
        if (isSecondaryActive) {
            const label = nextId.charAt(0).toUpperCase() + nextId.slice(1);
            newSecondaryMap[nextId] = getDefaultSecondaryAttrs(label, nextId);
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
                const label = labelsMap[cat] || cat;
                const defaultSec = getDefaultSecondaryAttrs(label, cat);

                // If it doesn't exist or is empty, fill it
                if (!newSecondary[cat] || newSecondary[cat].length !== 2 ||
                    (newSecondary[cat][0] === "" && newSecondary[cat][1] === "")) {
                    const existing = newSecondary[cat] || [];
                    newSecondary[cat] = [
                        existing[0] || defaultSec[0],
                        existing[1] || defaultSec[1]
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

    const addAttribute = () => {
        const newAttributesMap = { ...attributesMap };
        Object.keys(newAttributesMap).forEach(cat => {
            newAttributesMap[cat] = [...newAttributesMap[cat], `Attr ${newAttributesMap[cat].length + 1}`];
        });

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                attributes: newAttributesMap
            }
        });
    };

    const removeAttribute = (index: number) => {
        const newAttributesMap = { ...attributesMap };
        Object.keys(newAttributesMap).forEach(cat => {
            const newList = [...newAttributesMap[cat]];
            newList.splice(index, 1);
            newAttributesMap[cat] = newList;
        });

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                attributes: newAttributesMap
            }
        });
    };

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

                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1"><Shield size={12} /> Primaires</h4>
                    <button
                        onClick={addAttribute}
                        className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-200 transition-colors font-bold"
                        title="Ajouter un attribut à TOUS les pavés"
                    >
                        +
                    </button>
                </div>
                <div className="space-y-1 mb-6 flex-grow">
                    {primaryList.map((name, index) => (
                        <div key={`prim-${index}`} className="flex items-center gap-2 group">
                            <span className="text-[10px] text-slate-300 w-4 select-none">{index + 1}</span>
                            <input
                                value={name}
                                onChange={(e) => updateItemName(category, index, e.target.value)}
                                className="flex-grow text-sm font-medium border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-1 py-0.5 outline-none bg-transparent focus:bg-white transition-all"
                            />
                            <button
                                onClick={() => removeAttribute(index)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                title="Supprimer cet index de TOUS les pavés"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
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
                    {/* Presets Grid */}
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-tighter flex items-center gap-1">
                                <LayoutGrid size={14} /> Bibliothèque de Préréglages
                            </h5>
                            <button
                                onClick={() => setIsSaveModalOpen(true)}
                                className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors font-bold flex items-center gap-1"
                                title="Sauvegarder la config actuelle"
                            >
                                <Save size={12} /> Sauver Actuel
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {isLoadingPresets ? (
                                <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span className="text-xs font-medium">Chargement des préréglages...</span>
                                </div>
                            ) : dbPresets.map((preset, idx) => (
                                <div
                                    key={preset.id || idx}
                                    onClick={() => requestPresetLoad(preset)}
                                    className="relative bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded p-3 text-left transition-all group/card cursor-pointer flex flex-col justify-between min-h-[80px]"
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-1 gap-2">
                                            <span className="font-bold text-slate-700 text-xs group-hover/card:text-amber-900 truncate flex-grow">
                                                {preset.name}
                                            </span>

                                            {/* Micro-structure relocated to header */}
                                            <div className="flex gap-0.5 items-center">
                                                {preset.structure.map((pave: any, i: number) => {
                                                    const isSecondary = ((preset as any).has_secondary || (preset as any).hasSecondary);
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`flex flex-col gap-0.5 p-0.5 rounded-[1px] border ${isSecondary ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-200'
                                                                }`}
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
                                                        onClick={(e) => handleDeletePreset(e, preset.id)}
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
                            {!isLoadingPresets && dbPresets.length === 0 && ATTRIBUTE_PRESETS.map((preset, idx) => (
                                <button
                                    key={`hc-${idx}`}
                                    onClick={() => requestPresetLoad(preset)}
                                    className="bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded p-3 text-left transition-all group/card flex flex-col justify-between min-h-[80px]"
                                >
                                    <div className="flex justify-between items-center mb-1 gap-2">
                                        <div className="min-w-0 flex-grow">
                                            <span className="block font-bold text-slate-700 text-xs group-hover/card:text-amber-900 truncate">{preset.name}</span>
                                            <span className="text-[10px] text-slate-400 italic font-medium leading-tight truncate">{preset.structure.length} Pavés</span>
                                        </div>

                                        {/* Micro-structure for hardcoded relocated */}
                                        <div className="flex gap-0.5 items-center shrink-0">
                                            {preset.structure.map((pave: any, i: number) => {
                                                const isSec = (preset as any).hasSecondary;
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
                </div>
            </div>

            {/* COLUMNS SECTION */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700 uppercase tracking-widest text-sm flex items-center gap-2">
                        <LayoutGrid size={18} className="text-blue-600" /> Structure ({categories.length} / 5 Pavés)
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Secondaires</span>
                            <button
                                onClick={toggleSecondaryGlobal}
                                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${rules.configurations.global.secondaryAttributes ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                                <div className={`bg-white w-3 h-3 rounded-full shadow transform transition-transform duration-200 ${rules.configurations.global.secondaryAttributes ? 'translate-x-4' : ''}`} />
                            </button>
                        </div>

                        <button
                            onClick={addCategory}
                            disabled={categories.length >= 5}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${categories.length >= 5
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                        >
                            <Plus size={14} /> Ajouter un Pavé
                        </button>
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${Math.min(categories.length, 5)} gap-6`}>
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
                                onClick={handleSaveCurrentAsPreset}
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
                                {categories.map(cat => (
                                    <div key={cat} className="bg-white px-2 py-1 rounded border border-slate-200 text-[10px] font-bold text-slate-700">
                                        {labelsMap[cat] || cat} ({attributesMap[cat].length})
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

export default AdminAttributesEditor;
