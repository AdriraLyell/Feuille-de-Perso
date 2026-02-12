import { useCallback } from 'react';
import { DotEntry, SuggestionEntry } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { generateId } from '../utils/factories';
import { RulesData } from '../types/rules';
import { CharacterSheetData } from '../types/character';
import { getSkillCategory, getCounter, setCounter } from '../utils/stateAccessors';

export const useCharacterSheetActions = (
    data: CharacterSheetData,
    onChange: (update: (prev: CharacterSheetData) => CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void,
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

            const isCreationMode = prev.creationConfig && prev.creationConfig.active;
            const catDef = rules?.definitions?.skillCategories?.find(c => c.id === category);
            const behavior = catDef?.behavior;
            const isBaseSkill = !behavior || behavior === 'Compétence' || behavior === 'Secondaire';

            const newList = list.map(item => {
                if (item.id !== id) return item;
                if (isCreationMode && isBaseSkill) {
                    return { ...item, value, creationValue: value };
                }
                return { ...item, value };
            });

            const itemName = list.find(item => item.id === id)?.name || 'Compétence';
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

    const handleDropItem = useCallback((category: string, payload: any, targetIndex?: number) => {
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
            ? itemData
            : {
                id: generateId(),
                name: itemData.name,
                value: 0,
                creationValue: 0,
                max: 5,
                description: itemData.description,
                isVariable: itemData.isVariable,
                definitionId: itemData.id
            };

        onChange(prev => {
            let updatedSkills = { ...prev.skills };
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
            const isCreationMode = prev.creationConfig && prev.creationConfig.active;

            const updateInList = (list: any[]) => {
                const idx = list.findIndex(item => item.id === id);
                if (idx === -1) return null;
                const newList = [...list];
                const item = newList[idx];
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
            const isCreationMode = prev.creationConfig && prev.creationConfig.active;
            if (isCustom) {
                const newCustom = (prev.counters.custom || []).map(c => {
                    if (c.id !== id) return c;
                    const newItem = { ...c };
                    if (field === 'value') {
                        newItem.value = value;
                        if (isCreationMode) newItem.creationValue = value;
                        if ((newItem.current || 0) > value) newItem.current = value;
                    } else {
                        newItem.current = Math.min(value, newItem.value);
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

                const sysDef = (rules?.definitions?.counters as any)?.[id] || (rules?.definitions?.counters as any)?.[counterKey];
                const displayName = current.name || sysDef?.name || id;
                const libDef = rules?.libraries?.counters?.find(c => c.id === id || normalizeString(c.name) === normalizeString(displayName));

                const xpCost = libDef?.xpCost !== undefined ? libDef.xpCost : (sysDef?.xpCost ?? 0);
                const defaultValue = libDef?.defaultValue !== undefined ? libDef.defaultValue : (sysDef?.defaultValue ?? 0);

                if (field === 'value' && (libDef || sysDef)) {
                    if (xpCost <= 0 && value > current.value) return prev;
                    if (value < defaultValue) return prev;
                }

                const newItem = { ...current };
                if (field === 'value') {
                    newItem.value = value;
                    if ((newItem.current || 0) > value) newItem.current = value;
                } else {
                    newItem.current = Math.min(value, newItem.value);
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
