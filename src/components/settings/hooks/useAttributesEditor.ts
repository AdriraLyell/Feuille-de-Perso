import { useState } from 'react';
import { CharacterSheetData } from '../../../types';
import { DEFAULT_ATTRIBUTES, ATTRIBUTE_PRESETS } from '../../../data/defaults/attributes';

interface UseAttributesEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

export const useAttributesEditor = ({ data, onUpdate, onAddLog }: UseAttributesEditorProps) => {
    const [pendingPreset, setPendingPreset] = useState<any>(null);
    const [showPresetConfirm, setShowPresetConfirm] = useState(false);

    const categories = data.attributeSettings || [];
    const count = categories.length;

    const firstCatId = categories[0]?.id;
    const globalAttrCount = firstCatId && data.attributes[firstCatId]
        ? data.attributes[firstCatId].length
        : 4;

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
                val1: "0", val2: "", val3: "",
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
            { id: 'pave_attributs_1', label: 'Physique' },
            { id: 'pave_attributs_2', label: 'Mental' },
            { id: 'pave_attributs_3', label: 'Social' },
            { id: 'pave_attributs_4', label: 'Mystique' }
        ];

        const currentDefs = [...data.attributeSettings];
        const currentAttributes = { ...data.attributes };

        const firstCat = currentDefs[0]?.id;
        const currentAttrCount = firstCat && currentAttributes[firstCat] ? currentAttributes[firstCat].length : 4;

        if (newCount > currentDefs.length) {
            for (let i = currentDefs.length; i < newCount; i++) {
                let defToAdd = defaultDefs[i];
                if (!defToAdd) {
                    defToAdd = { id: `pave_attributs_${i + 1}`, label: `Pavé ${i + 1}` };
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
                        val1: "0", val2: "", val3: ""
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
                        val1: "0", val2: "", val3: ""
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
        const newSecondary = { ...data.secondaryAttributes };

        if (isActive) {
            data.attributeSettings.forEach(cat => {
                if (!newSecondary[cat.id]) {
                    newSecondary[cat.id] = [
                        { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 1', val1: "0", val2: "", val3: "" },
                        { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 2', val1: "0", val2: "", val3: "" }
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

    return {
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
    };
};
