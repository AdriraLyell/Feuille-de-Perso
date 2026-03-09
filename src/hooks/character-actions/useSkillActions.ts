import { useCallback } from 'react';
import { DotEntry, SuggestionEntry, XPTransaction, DropPayload } from '../../types';
import { RulesData } from '../../types/rules';
import { CharacterSheetData } from '../../types/character';
import { getSkillCategory, getCounter, setCounter } from '../../utils/stateAccessors';
import { generateId } from '../../utils/factories';

export const useSkillActions = (
    onChange: (update: (prev: CharacterSheetData) => CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void,
    recordXPTransaction: (transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => void,
    rules: RulesData | null
) => {
    const updateDot = useCallback((section: 'skills', category: string, id: string, value: number) => {
        onChange(prev => {
            const list = getSkillCategory(prev, category);
            if (!list) return prev;

            const isCreationMode = (prev.creationConfig && prev.creationConfig.active) || prev.attributeMigrationMode;
            const catDef = rules?.definitions?.skillCategories?.find(c => c.id === category);
            const behavior = catDef?.behavior;
            const isBaseSkill = !behavior || behavior === 'Compétence' || behavior === 'Secondaire' || behavior === 'Arrière-plan';

            const itemToUpdate = list.find(item => item.id === id);
            if (!itemToUpdate) return prev;

            // Recalculate cost if it's an XP purchase (not creation mode)
            if (!isCreationMode && itemToUpdate.value !== value) {
                const multiplier = catDef?.costConfig?.factor ?? 1.0;
                const isTriangular = catDef?.costConfig?.type === 'triangular';
                const isUpgrade = value > itemToUpdate.value;

                // Helpers for XP calculation
                const triangular = (n: number) => (n * (n + 1)) / 2;
                const getXPCost = (curr: number, creat: number) => {
                    if (curr <= creat) return 0;
                    return isTriangular ? (triangular(curr) - triangular(creat)) * multiplier : (curr - creat) * multiplier;
                };

                const oldCost = getXPCost(itemToUpdate.value, itemToUpdate.creationValue || 0);
                const newCost = getXPCost(value, itemToUpdate.creationValue || 0);
                const diff = Math.abs(newCost - oldCost);

                if (diff !== 0) {
                    recordXPTransaction({
                        type: isUpgrade ? 'spend' : 'refund',
                        description: `${isUpgrade ? 'Amélioration' : 'Réduction'} : ${itemToUpdate.name} (${itemToUpdate.value} → ${value})`,
                        amount: diff,
                        source: 'XP Libre',
                        relatedId: id
                    });
                }
            }

            const newList = list.map(item => {
                if (item.id !== id) return item;
                if (isCreationMode && isBaseSkill) {
                    return { ...item, value, creationValue: value };
                }
                return { ...item, value };
            });

            const itemName = itemToUpdate.name || 'Compétence';
            onAddLog(`Modification ${String(itemName)} : ${value}`, 'info', 'sheet', `dot_${String(id)}`);

            const updatedState: CharacterSheetData = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [String(category)]: newList
                }
            };

            if (section === 'skills' && prev.counters) {
                const counterKey = Object.keys(prev.counters).find(k => k === id);
                if (counterKey) {
                    const currentCounter = getCounter(prev, counterKey);
                    if (currentCounter && !Array.isArray(currentCounter)) {
                        const newCounter = { ...currentCounter, value, creationValue: isCreationMode ? value : currentCounter.creationValue };
                        const updatedCounters = { ...prev.counters };
                        setCounter({ ...prev, counters: updatedCounters } as CharacterSheetData, counterKey, newCounter);
                        updatedState.counters = updatedCounters;
                    }
                }
            }

            return updatedState;
        });
    }, [onChange, onAddLog, recordXPTransaction, rules]);

    const handleDropItem = useCallback((category: string, payload: DropPayload, targetIndex?: number) => {
        const { type, data: itemData, categoryType } = payload;
        const catDef = rules?.definitions?.skillCategories?.find(c => c.id === category);
        const behavior = catDef?.behavior || 'Compétence';

        if (categoryType === 'skill' && (behavior !== 'Compétence' && behavior !== 'Secondaire')) {
            onAddLog("Action bloquée : Cette catégorie n'accepte pas les compétences.", 'danger', 'sheet');
            return;
        }
        if (categoryType === 'background' && behavior !== 'Arrière-plan') {
            onAddLog("Action bloquée : Cette catégorie n'accepte pas les historiques.", 'danger', 'sheet');
            return;
        }

        const newEntry: DotEntry = type === 'sheet_item'
            ? (itemData as DotEntry)
            : {
                id: generateId(),
                name: itemData.name,
                value: 0,
                creationValue: 0,
                max: 5,
                variant: itemData.isVariable ? "" : undefined,
                description: itemData.description,
                definitionId: itemData.id,
                mysticAbilityId: (itemData as Record<string, unknown>).mysticAbilityId as string | undefined,
                playerAdded: true
            };

        onChange(prev => {
            const updatedSkills = { ...prev.skills };
            if (type === 'sheet_item') {
                Object.keys(updatedSkills).forEach(cat => {
                    updatedSkills[cat] = (updatedSkills[cat] || []).filter(s => s.id !== newEntry.id);
                });
            }

            const currentList = [...(updatedSkills[category] || [])];
            if (newEntry.name && !itemData.isVariable && currentList.some(s => s.name?.toLowerCase() === itemData.name.toLowerCase() && s.id !== newEntry.id)) {
                return prev;
            }

            if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= currentList.length) {
                currentList.splice(targetIndex, 0, newEntry);
            } else {
                currentList.push(newEntry);
            }

            updatedSkills[category] = currentList;
            const newState = { ...prev, skills: updatedSkills };

            if (type === 'custom_lib_item') {
                const suggestionType = categoryType || (category.toLowerCase().includes('background') || category.toLowerCase().includes('arrière-plan') ? 'background' : 'skill');
                const suggestion: SuggestionEntry = {
                    id: generateId(),
                    type: suggestionType as 'skill' | 'background',
                    name: itemData.name,
                    category: category,
                    timestamp: Date.now(),
                    description: itemData.description || undefined,
                    tags: Array.isArray(itemData.tags) ? itemData.tags : undefined,
                    effects: Array.isArray(itemData.effects) ? itemData.effects : undefined,
                    pointsLabel: typeof itemData.pointsLabel === 'string' ? itemData.pointsLabel : undefined,
                    cost: itemData.cost ? Number(itemData.cost) : undefined
                };
                newState.suggestions = [...(prev.suggestions || []), suggestion];
                onAddLog(`Suggestion créée pour le MJ : ${itemData.name}`, 'info', 'sheet');
            }

            return newState;
        });

        onAddLog(type === 'sheet_item' ? `Déplacement : ${itemData.name || 'Espaceur'}` : `Ajout réussi : ${itemData.name || 'Espaceur'}`, 'success', 'sheet');
    }, [onChange, onAddLog, rules]);

    const handleRemoveItem = useCallback((category: string, id: string) => {
        onChange(prev => {
            const currentList = prev.skills[category] || [];
            const itemToRemove = currentList.find(s => s.id === id);

            if (itemToRemove && itemToRemove.name && (itemToRemove.value || 0) > 0) {
                onAddLog(`Action bloquée : Impossible de supprimer une compétence avec des points investis.`, 'danger', 'sheet');
                return prev;
            }

            const updatedList = currentList.filter(s => s.id !== id);
            return { ...prev, skills: { ...prev.skills, [category]: updatedList } };
        });
        onAddLog("Élément supprimé de la fiche", 'info', 'sheet');
    }, [onChange, onAddLog]);

    return { updateDot, handleDropItem, handleRemoveItem };
};
