import { useState, useEffect } from 'react';
import { RulesData } from '../../types/rules';
import { AttributePreset } from '../../types/system';
import { AttributeService } from '../../services/AttributeService';
import { DEFAULT_ATTRIBUTES, getDefaultSecondaryAttrs } from '../../data/defaults/attributes';

export const useAttributeEditor = (rules: RulesData, onUpdate: (newRules: RulesData) => void) => {
    const definitions = rules.definitions;
    const attributesMap = definitions.attributes || {};
    const secondaryMap = definitions.secondaryAttributes || {};
    const labelsMap = definitions.labels || {};

    // Standard order for sorting categories
    const STANDARD_ORDER = ['pave_attributs_1', 'pave_attributs_2', 'pave_attributs_3', 'pave_attributs_4', 'pave_attributs_5'];

    const categories = Object.keys(attributesMap).sort((a, b) => {
        const indexA = STANDARD_ORDER.indexOf(a);
        const indexB = STANDARD_ORDER.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    // States
    const [showPresetConfirm, setShowPresetConfirm] = useState(false);
    const [pendingPreset, setPendingPreset] = useState<any>(null);
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
        if (preset.structure && !preset.structure[0].secondaryAttrs && preset.structure[0].attrs) {
            preset.structure = preset.structure.map((cat: any) => ({
                ...cat,
                secondaryAttrs: []
            }));
        }
        setPendingPreset(preset);
        setShowPresetConfirm(true);
    };

    const handleSaveCurrentAsPreset = async (name: string, desc: string) => {
        const structure = categories.map(cat => ({
            id: cat,
            label: labelsMap[cat] || cat,
            attrs: [...attributesMap[cat]],
            secondaryAttrs: rules.configurations.global.secondaryAttributes ? [...(secondaryMap[cat] || [])] : []
        }));

        const isSecondaryActive = !!rules.configurations.global.secondaryAttributes;
        const success = await AttributeService.saveAttributePreset(name, desc, structure, isSecondaryActive);
        if (success) {
            loadDBPresets();
        }
    };

    const handleDeletePreset = async (id: string) => {
        if (!confirm("Supprimer ce préréglage ?")) return;
        const success = await AttributeService.deleteAttributePreset(id);
        if (success) loadDBPresets();
    };

    const handleUpdatePreset = async (id: string, name: string, description: string) => {
        const success = await AttributeService.updateAttributePreset(id, { name, description });
        if (success) loadDBPresets();
        return success;
    };

    const executePresetLoad = () => {
        if (!pendingPreset) return;

        const newAttributes: Record<string, string[]> = {};
        const newLabels: Record<string, string> = { ...labelsMap };
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
        if (categories.includes(nextId)) {
            nextId = `pave_attributs_${count + 1}_${Math.random().toString(36).substr(2, 3)}`;
        }

        const firstCatId = categories[0];
        const attributeCount = firstCatId ? (attributesMap[firstCatId]?.length || 0) : 4;

        let defaults = DEFAULT_ATTRIBUTES[nextId] || [];
        if (defaults.length < attributeCount) {
            const extra = Array(attributeCount - defaults.length).fill(0).map((_, i) => `Attribut ${defaults.length + i + 1}`);
            defaults = [...defaults, ...extra];
        } else if (defaults.length > attributeCount) {
            defaults = defaults.slice(0, attributeCount);
        }

        if (defaults.length === 0) {
            defaults = Array(attributeCount).fill(0).map((_, i) => `Attribut ${i + 1}`);
        }

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
        const newSecondary = { ...secondaryMap };
        if (newActive) {
            Object.keys(attributesMap).forEach(cat => {
                const label = labelsMap[cat] || cat;
                const defaultSec = getDefaultSecondaryAttrs(label, cat);
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

    return {
        categories,
        attributesMap,
        secondaryMap,
        labelsMap,
        states: {
            showPresetConfirm,
            setShowPresetConfirm,
            pendingPreset,
            setPendingPreset,
            dbPresets,
            isLoadingPresets
        },
        actions: {
            addCategory,
            removeCategory,
            updateLabel,
            addAttribute,
            removeAttribute,
            updateItemName,
            toggleSecondaryGlobal,
            updateSecondaryItemName,
            requestPresetLoad,
            executePresetLoad,
            handleSaveCurrentAsPreset,
            handleDeletePreset,
            handleUpdatePreset
        }
    };
};
