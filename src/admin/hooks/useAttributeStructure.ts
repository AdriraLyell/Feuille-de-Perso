import { useCallback, useMemo } from 'react';
import { RulesData } from '../../types/rules';
import { DEFAULT_ATTRIBUTES, getDefaultSecondaryAttrs } from '../../data/defaults/attributes';

interface UseAttributeStructureProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    requestConfirm: (title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info') => void;
}

const STANDARD_ORDER = ['pave_attributs_1', 'pave_attributs_2', 'pave_attributs_3', 'pave_attributs_4', 'pave_attributs_5'];

export const useAttributeStructure = ({
    rules,
    onUpdate,
    requestConfirm
}: UseAttributeStructureProps) => {
    const definitions = rules.definitions;
    const attributesMap = definitions.attributes || {};
    const secondaryMap = definitions.secondaryAttributes || {};
    const labelsMap = definitions.labels || {};

    const categories = useMemo(() => {
        return Object.keys(attributesMap).sort((a, b) => {
            const indexA = STANDARD_ORDER.indexOf(a);
            const indexB = STANDARD_ORDER.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [attributesMap]);

    const addCategory = useCallback(() => {
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
    }, [categories, attributesMap, secondaryMap, labelsMap, rules, onUpdate]);

    const removeCategory = useCallback((categoryId: string) => {
        if (categories.length <= 1) return;
        requestConfirm(
            `Supprimer le pavé "${labelsMap[categoryId] || categoryId}" ?`,
            "Toutes les données associées seront perdues.",
            () => {
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
            },
            'danger'
        );
    }, [categories, labelsMap, attributesMap, secondaryMap, rules, onUpdate, requestConfirm]);

    const toggleSecondaryGlobal = useCallback(() => {
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
    }, [rules, attributesMap, secondaryMap, labelsMap, onUpdate]);

    const updateSecondaryItemName = useCallback((category: string, index: number, newName: string) => {
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
    }, [secondaryMap, rules, onUpdate]);

    const updateLabel = useCallback((category: string, newLabel: string) => {
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
    }, [labelsMap, rules, onUpdate]);

    const addAttribute = useCallback(() => {
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
    }, [attributesMap, categories, rules, onUpdate]);

    const removeAttribute = useCallback((index: number) => {
        const newAttributesMap = { ...attributesMap };
        const count = attributesMap[categories[0]]?.length || 0;
        if (count <= 1) return;

        requestConfirm(
            "Supprimer l'attribut ?",
            "Cet attribut sera retiré de tous les pavés.",
            () => {
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
            },
            'danger'
        );
    }, [attributesMap, categories, rules, onUpdate, requestConfirm]);

    const updateItemName = useCallback((category: string, index: number, newName: string) => {
        const newAttributesMap = { ...attributesMap };
        newAttributesMap[category][index] = newName;
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                attributes: newAttributesMap
            }
        });
    }, [attributesMap, rules, onUpdate]);

    return {
        categories,
        attributesMap,
        secondaryMap,
        labelsMap,
        addCategory,
        removeCategory,
        toggleSecondaryGlobal,
        updateSecondaryItemName,
        updateLabel,
        addAttribute,
        removeAttribute,
        updateItemName
    };
};
