import { useState, useEffect, useCallback } from 'react';
import { RulesData } from '../../types/rules';
import { AttributePreset } from '../../types/system';
import { AttributeService } from '../../services/AttributeService';

interface UseAttributePresetsProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    categories: string[];
    labelsMap: Record<string, string>;
    attributesMap: Record<string, string[]>;
    secondaryMap: Record<string, string[]>;
    requestConfirm: (title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info') => void;
}

export const useAttributePresets = ({
    rules,
    onUpdate,
    categories,
    labelsMap,
    attributesMap,
    secondaryMap,
    requestConfirm
}: UseAttributePresetsProps) => {
    const [showPresetConfirm, setShowPresetConfirm] = useState(false);
    const [pendingPreset, setPendingPreset] = useState<AttributePreset | null>(null);
    const [dbPresets, setDbPresets] = useState<AttributePreset[]>([]);
    const [isLoadingPresets, setIsLoadingPresets] = useState(true);

    const loadDBPresets = useCallback(async () => {
        setIsLoadingPresets(true);
        const data = await AttributeService.listAttributePresets();
        if (data) setDbPresets(data);
        setIsLoadingPresets(false);
    }, []);

    useEffect(() => {
        loadDBPresets();
    }, [loadDBPresets]);

    const requestPresetLoad = useCallback((preset: AttributePreset) => {
        if (preset.structure && Array.isArray(preset.structure) && preset.structure.length > 0 && !preset.structure[0].secondaryAttrs && preset.structure[0].attrs) {
            preset.structure = preset.structure.map((cat) => ({
                ...cat,
                secondaryAttrs: []
            }));
        }
        setPendingPreset(preset);
        setShowPresetConfirm(true);
    }, []);

    const handleSaveCurrentAsPreset = useCallback(async (name: string, desc: string) => {
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
    }, [categories, labelsMap, attributesMap, secondaryMap, rules.configurations.global.secondaryAttributes, loadDBPresets]);

    const handleDeletePreset = useCallback((id: string) => {
        requestConfirm(
            "Supprimer le Préréglage ?",
            "Cette action est irréversible.",
            async () => {
                const success = await AttributeService.deleteAttributePreset(id);
                if (success) loadDBPresets();
            },
            'danger'
        );
    }, [requestConfirm, loadDBPresets]);

    const handleUpdatePreset = useCallback(async (id: string, name: string, description: string) => {
        const success = await AttributeService.updateAttributePreset(id, { name, description });
        if (success) loadDBPresets();
        return success;
    }, [loadDBPresets]);

    const executePresetLoad = useCallback(() => {
        if (!pendingPreset) return;

        const newAttributes: Record<string, string[]> = {};
        const newLabels: Record<string, string> = { ...labelsMap };
        const newSecondary: Record<string, string[]> = { ...secondaryMap };
        const hasSecondaryInPreset = pendingPreset.hasSecondary || false;

        pendingPreset.structure.forEach((cat: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    }, [pendingPreset, labelsMap, secondaryMap, onUpdate, rules]);

    return {
        showPresetConfirm,
        setShowPresetConfirm,
        pendingPreset,
        setPendingPreset,
        dbPresets,
        isLoadingPresets,
        loadDBPresets,
        requestPresetLoad,
        handleSaveCurrentAsPreset,
        handleDeletePreset,
        handleUpdatePreset,
        executePresetLoad
    };
};
