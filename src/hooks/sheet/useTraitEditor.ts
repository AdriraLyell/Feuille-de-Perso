import { useState } from 'react';
import { CharacterSheetData, LibraryEntry } from '../../types';
import { RulesData } from '../../types/rules';

export const useTraitEditor = (
    data: CharacterSheetData,
    _rules: RulesData | null,
    onChange: (newData: CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', detail?: string) => void
) => {
    const [multiSelectTarget, setMultiSelectTarget] = useState<'avantages' | 'desavantages' | null>(null);

    const removeTrait = (type: 'avantages' | 'desavantages', index: number) => {
        const list = [...data.page2[type]];
        const removedName = list[index].name;
        list[index] = { name: '', value: '', variant: '', description: '', tag: '', definitionId: undefined };
        onChange({ ...data, page2: { ...data.page2, [type]: list } });
        if (removedName.trim()) {
            onAddLog(`Suppression ${type === 'avantages' ? 'Avantage' : 'Désavantage'} : ${removedName}`, 'info', 'sheet');
        }
    };

    const handleMultiAdd = (instances: { entry: LibraryEntry; variant?: string; cost?: string }[]) => {
        if (!multiSelectTarget) return;
        const currentList = [...data.page2[multiSelectTarget]];
        let addedCount = 0;
        let totalXPCost = 0;
        let listIndex = 0;
        const isPostCreation = !data.creationConfig?.active;
        const traitCostFactor = _rules?.configurations?.xpCosts?.traitCost ?? (data.xpCosts?.traitCost ?? 5);

        instances.forEach(instance => {
            const entry = instance.entry;
            const costValue = instance.cost || entry.cost || "";

            while (listIndex < currentList.length && currentList[listIndex].name.trim() !== '') {
                listIndex++;
            }

            if (listIndex < currentList.length) {
                currentList[listIndex] = {
                    name: entry.name,
                    value: costValue,
                    description: entry.description || "",
                    tag: entry.tags?.[0] || '',
                    variant: instance.variant || '',
                    definitionId: entry.id,
                    mysticAbilityId: entry.mysticAbilityId || undefined,
                    isPostCreation: isPostCreation ? true : undefined,
                    creationValue: isPostCreation ? "0" : undefined
                };

                if (isPostCreation) {
                    const points = parseInt(costValue) || 0;
                    totalXPCost += points * traitCostFactor;
                }
                addedCount++;
            }
        });

        if (addedCount > 0) {
            const newData = { ...data, page2: { ...data.page2, [multiSelectTarget]: currentList } };

            if (isPostCreation && totalXPCost > 0) {
                onAddLog(`Achat de ${addedCount} trait(s) pour ${totalXPCost} XP.`, 'success', 'sheet');
            } else {
                onAddLog(`Ajout de ${addedCount} trait(s).`, 'success', 'sheet');
            }

            onChange(newData);
        }
        setMultiSelectTarget(null);
    };

    return {
        multiSelectTarget,
        setMultiSelectTarget,
        removeTrait,
        handleMultiAdd
    };
};
