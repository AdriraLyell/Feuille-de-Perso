import React, { useState, useEffect } from 'react';
import { RulesData } from '../../types/rules';
import { AttributePreset } from '../../types/system';
import { Plus, Trash2, Shield, Zap, LayoutGrid, Play, Info, Save, Loader2 } from 'lucide-react';
import { CampaignService } from '../../services/CampaignService';
import { AttributeService } from '../../services/AttributeService';
import ThematicModal from '../../components/ui/ThematicModal';
import { DEFAULT_ATTRIBUTES, ATTRIBUTE_PRESETS, getDefaultSecondaryAttrs } from '../../data/defaults/attributes';
import AttributeCategoryCard from './attributes/AttributeCategoryCard';
import AttributePresetManager from './attributes/AttributePresetManager';

interface AdminAttributesEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}


const AdminAttributesEditor: React.FC<AdminAttributesEditorProps> = ({ rules, onUpdate }) => {
    const definitions = rules.definitions;
    const attributesMap = definitions.attributes || {};
    const secondaryMap = definitions.secondaryAttributes || {};
    const labelsMap = definitions.labels || {};

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

    // States for Modals
    const [showPresetConfirm, setShowPresetConfirm] = useState(false);
    const [pendingPreset, setPendingPreset] = useState<any>(null);

    // DB Presets
    const [dbPresets, setDbPresets] = useState<AttributePreset[]>([]);
    const [isLoadingPresets, setIsLoadingPresets] = useState(true);

    useEffect(() => {
        loadDBPresets();
    }, []);

    const loadDBPresets = async () => {
        setIsLoadingPresets(true);
        const data = await AttributeService.listAttributePresets();
        if (data) setDbPresets(data);
        setIsLoadingPresets(false);
    };

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

    const handleSaveCurrentAsPreset = async (name: string, desc: string) => {
        // Structure current attributes for the preset
        const structure = categories.map(cat => ({
            id: cat,
            label: labelsMap[cat] || cat,
            attrs: [...attributesMap[cat]],
            secondaryAttrs: rules.configurations.global.secondaryAttributes ? [...(secondaryMap[cat] || [])] : []
        }));

        const isSecondaryActive = !!rules.configurations.global.secondaryAttributes;
        const success = await AttributeService.saveAttributePreset(name, desc, structure, isSecondaryActive);
        if (success) {
            loadDBPresets(); // Refresh
        }
    };

    const handleDeletePreset = async (id: string) => {
        if (!confirm("Supprimer ce préréglage ?")) return;
        const success = await AttributeService.deleteAttributePreset(id);
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
        if (categories.length <= 1) return;
        if (!confirm(`Supprimer le pavé "${labelsMap[categoryId] || categoryId}" ?`)) return;

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
        const newSecondary = { ...secondaryMap };
        if (!newSecondary[category]) newSecondary[category] = ["", ""];
        newSecondary[category][index] = newName;

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                secondaryAttributes: newSecondary
            }
        });
    };

    const updateLabel = (category: string, newLabel: string) => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                labels: {
                    ...labelsMap,
                    [category]: newLabel
                }
            }
        });
    };

    const addAttribute = () => {
        const newAttributesMap = { ...attributesMap };
        const count = attributesMap[categories[0]]?.length || 0;
        const newName = `Attribut ${count + 1}`;

        Object.keys(newAttributesMap).forEach(cat => {
            newAttributesMap[cat] = [...newAttributesMap[cat], newName];
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
        const count = attributesMap[categories[0]]?.length || 0;
        if (count <= 1) return;

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
        const newAttributesMap = { ...attributesMap };
        newAttributesMap[category][index] = newName;

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                attributes: newAttributesMap
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Info */}
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <div className="flex gap-3">
                    <Info className="text-blue-500 shrink-0" size={20} />
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-blue-900">Information sur la Structure</h4>
                        <p className="text-xs text-blue-800/80 leading-relaxed">
                            Tous les pavés d'attributs doivent avoir le <span className="font-bold underline">même nombre</span> de caractéristiques.
                            Les modifications de nombre d'attributs (ajout/suppression) s'appliquent automatiquement à l'ensemble des pavés.
                        </p>
                    </div>
                </div>
            </div>

            {/* PRESETS SECTION */}
            <AttributePresetManager
                dbPresets={dbPresets}
                isLoading={isLoadingPresets}
                onLoadRequested={requestPresetLoad}
                onSaveRequested={handleSaveCurrentAsPreset}
                onDeleteRequested={handleDeletePreset}
                currentStructureSummary={categories.map(cat => ({
                    label: labelsMap[cat] || cat,
                    count: attributesMap[cat].length
                }))}
            />

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
                    {categories.map(cat => (
                        <AttributeCategoryCard
                            key={cat}
                            id={cat}
                            label={labelsMap[cat] || cat}
                            primaryAttrs={attributesMap[cat]}
                            secondaryAttrs={secondaryMap[cat]}
                            isSecondaryActive={!!rules.configurations.global.secondaryAttributes}
                            onUpdateLabel={updateLabel}
                            onUpdatePrimary={updateItemName}
                            onUpdateSecondary={updateSecondaryItemName}
                            onAddAttribute={addAttribute}
                            onRemoveAttribute={removeAttribute}
                            onRemoveCategory={removeCategory}
                        />
                    ))}
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
