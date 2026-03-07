import { useCallback } from 'react';
import { DotEntry, SuggestionEntry, XPTransaction, DropPayload } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { generateId } from '../utils/factories';
import { RulesData } from '../types/rules';
import { CharacterSheetData } from '../types/character';
import { getSkillCategory, getCounter, setCounter } from '../utils/stateAccessors';

export const useCharacterSheetActions = (
    data: CharacterSheetData,
    onChange: (update: (prev: CharacterSheetData) => CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void,
    recordXPTransaction: (transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => void,
    rules: RulesData | null
) => {

    const updateHeader = useCallback((field: keyof typeof data.header, value: string) => {
        onChange(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
        onAddLog(`En-tête modifiée : ${String(field)} = "${value}"`, 'info', 'sheet', `header_${String(field)}`);
    }, [onChange, onAddLog]);

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

                // Helper to calculate XP difference
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

            const updatedState = {
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
    }, [onChange, onAddLog, rules]);

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
                definitionId: itemData.id
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

            if (type === 'custom_lib_item' || type === 'lib_skill') {
                const suggestionType = categoryType || (category.toLowerCase().includes('background') || category.toLowerCase().includes('arrière-plan') ? 'background' : 'skill');
                const suggestion: SuggestionEntry = {
                    id: generateId(),
                    type: suggestionType as 'skill' | 'background',
                    name: itemData.name,
                    category: category,
                    timestamp: Date.now()
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

    const updateAttribute = useCallback((category: string, id: string, field: 'val1' | 'val2' | 'val3', value: string) => {
        onChange(prev => {
            const numValue = parseInt(value) || 0;
            const isCreationMode = (prev.creationConfig && prev.creationConfig.active) || prev.attributeMigrationMode;

            const updateInList = <T extends { id: string; name?: string; val1?: string; val2?: string; val3?: string; }>(list: T[]) => {
                const idx = list.findIndex(item => item.id === id);
                if (idx === -1) return null;
                const newList = [...list];
                const item = newList[idx];

                // Garde pour val1 hors mode création
                if (field === 'val1' && !isCreationMode) {
                    return null;
                }

                if (!isCreationMode && field === 'val2' && item.val2 !== value) {
                    const oldVal = parseInt(item.val2 || "0") || 0;
                    const newVal = numValue;
                    const diff = Math.abs(newVal - oldVal);
                    const costPerPoint = prev.xpCosts?.attributeFactor ?? 6;

                    if (diff !== 0) {
                        recordXPTransaction({
                            type: newVal > oldVal ? 'spend' : 'refund',
                            description: `${newVal > oldVal ? 'Augmentation' : 'Réduction'} Attribut : ${item.name} (+${diff})`,
                            amount: diff * costPerPoint,
                            source: 'XP Libre',
                            relatedId: id
                        });
                    }
                }

                const creationKey = `creation${field.charAt(0).toUpperCase() + field.slice(1)}`;
                newList[idx] = isCreationMode
                    ? { ...item, [field]: value, [creationKey]: numValue }
                    : { ...item, [field]: value };
                return { newList, name: item.name };
            };

            const attrResult = updateInList(prev.attributes?.[category] || []);
            if (attrResult) {
                onAddLog(`Attribut ${attrResult.name} modifié`, 'info', 'sheet', `attr_${id}_${field}`);
                return { ...prev, attributes: { ...prev.attributes, [category]: attrResult.newList } };
            }

            const secResult = updateInList(prev.secondaryAttributes?.[category] || []);
            if (secResult) {
                onAddLog(`Attribut ${secResult.name} modifié`, 'info', 'sheet', `attr_sec_${id}_${field}`);
                return { ...prev, secondaryAttributes: { ...prev.secondaryAttributes, [category]: secResult.newList } };
            }

            return prev;
        });
    }, [onChange, onAddLog]);

    const updateCombatWeapon = useCallback((id: string, field: string, value: string) => {
        onChange(prev => {
            const newWeapons = (prev.combat.weapons || []).map(w => w.id === id ? { ...w, [field]: value } : w);
            return { ...prev, combat: { ...prev.combat, weapons: newWeapons } };
        });
        onAddLog(`Arme modifiée (${field})`, 'info', 'sheet');
    }, [onChange, onAddLog]);

    const updateArmor = useCallback((index: number, field: string, value: string) => {
        onChange(prev => {
            const newArmor = [...(prev.combat.armor || [])];
            if (newArmor[index]) {
                newArmor[index] = { ...newArmor[index], [field]: value };
                return { ...prev, combat: { ...prev.combat, armor: newArmor } };
            }
            return prev;
        });
        onAddLog(`Armure modifiée (${field})`, 'info', 'sheet');
    }, [onChange, onAddLog]);

    const updateCounter = useCallback((id: string, value: number, isCustom = false, field: 'value' | 'current' = 'value') => {
        onChange(prev => {
            const isCreationMode = (prev.creationConfig && prev.creationConfig.active) || prev.attributeMigrationMode;
            if (isCustom) {
                const newCustom = (prev.counters.custom || []).map(c => {
                    if (c.id !== id) return c;
                    const newItem = { ...c };
                    if (field === 'value') {
                        newItem.value = value;
                        if (isCreationMode) newItem.creationValue = value;
                        const effectiveMax = newItem.variant === 'squares_only' ? (newItem.max || 10) : newItem.value;
                        if ((newItem.current || 0) > effectiveMax) newItem.current = effectiveMax;
                    } else if (field === 'current') {
                        newItem.current = value;
                    }
                    return newItem;
                });
                return { ...prev, counters: { ...prev.counters, custom: newCustom } };
            } else {
                const counterKey = Object.keys(prev.counters).find(k => {
                    const c = getCounter(prev, k);
                    return !Array.isArray(c) && c?.id === id;
                }) || id;
                const current = getCounter(prev, counterKey);
                if (!current || Array.isArray(current)) return prev;

                const displayName = current.name || id;
                const normalizedDisplayName = normalizeString(displayName);

                // 1. Try ID match in definitions
                let sysDef = rules?.definitions?.counters?.[id] || (rules?.definitions?.counters && rules.definitions.counters[counterKey]);
                // 2. Try Name match in definitions
                if (!sysDef && rules?.definitions?.counters) {
                    sysDef = Object.values(rules.definitions.counters).find(c => normalizeString(c.name) === normalizedDisplayName);
                }

                // 3. Try ID/Name match in libraries
                const VOLONTE_UUID = 'c0000000-0000-0000-0000-000000000001';
                const CONFIANCE_UUID = 'c0000000-0000-0000-0000-000000000002';
                const libDef = rules?.libraries?.counters?.find(c => 
                    c.id === id || 
                    normalizeString(c.name) === normalizedDisplayName ||
                    (normalizedDisplayName === 'volonte' && c.id === VOLONTE_UUID) ||
                    (normalizedDisplayName === 'confiance' && c.id === CONFIANCE_UUID)
                );

                const xpCost = libDef?.xpCost != null ? libDef.xpCost : (sysDef?.xpCost ?? 0);
                const defaultValue = libDef?.defaultValue != null ? libDef.defaultValue : (sysDef?.defaultValue ?? (sysDef as any)?.value ?? 0);

                if (field === 'value' && (libDef || sysDef)) {
                    if (xpCost <= 0 && value > current.value) return prev;
                    if (value < defaultValue) return prev;
                }

                const newItem = { ...current };
                if (field === 'value') {
                    if (!isCreationMode && current.value !== value) {
                        const isUpgrade = value > current.value;
                        const diff = Math.abs(value - current.value);
                        if (xpCost > 0 && diff !== 0) {
                            recordXPTransaction({
                                type: isUpgrade ? 'spend' : 'refund',
                                description: `${isUpgrade ? 'Augmentation' : 'Réduction'} Compteur : ${displayName}`,
                                amount: diff * xpCost,
                                source: 'XP Libre',
                                relatedId: id
                            });
                        }
                    }
                    newItem.value = value;
                    if ((newItem.current || 0) > value) newItem.current = value;
                } else if (field === 'current') {
                    newItem.current = value;
                }

                const updatedCounters = { ...prev.counters };
                setCounter({ ...prev, counters: updatedCounters } as CharacterSheetData, counterKey, newItem);
                const updatedState = { ...prev, counters: updatedCounters };

                // Sync with skills if applicable
                if (field === 'value' && prev.skills) {
                    const newSkills = { ...prev.skills };
                    let skillFound = false;
                    Object.keys(newSkills).forEach(catId => {
                        const list = newSkills[catId];
                        const idx = list.findIndex(s => s.id === id);
                        if (idx !== -1) {
                            const catDef = rules?.definitions?.skillCategories?.find(c => c.id === catId);
                            const isCounterCat = catDef?.behavior === 'Compteur';
                            const newList = [...list];
                            newList[idx] = { ...newList[idx], value, creationValue: (isCreationMode && !isCounterCat) ? value : newList[idx].creationValue };
                            newSkills[catId] = newList;
                            skillFound = true;
                        }
                    });
                    if (skillFound) updatedState.skills = newSkills;
                }
                return updatedState;
            }
        });
    }, [onChange, onAddLog, rules]);

    return {
        updateHeader,
        updateDot,
        handleDropItem,
        handleRemoveItem,
        updateAttribute,
        updateCombatWeapon,
        updateArmor,
        updateCounter
    };
};
