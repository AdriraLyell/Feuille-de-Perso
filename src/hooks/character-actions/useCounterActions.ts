import { useCallback } from 'react';
import { CharacterSheetData, XPTransaction } from '../../types';
import { RulesData } from '../../types/rules';
import { getCounter, setCounter } from '../../utils/stateAccessors';
import { normalizeString } from '../../utils/stringUtils';

export const useCounterActions = (
    onChange: (update: (prev: CharacterSheetData) => CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void,
    recordXPTransaction: (transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => void,
    rules: RulesData | null
) => {
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

                const sysDef = rules?.definitions?.counters?.[id] || (rules?.definitions?.counters && rules.definitions.counters[counterKey]);
                const displayName = current.name || sysDef?.name || id;
                const libDef = rules?.libraries?.counters?.find(c => c.id === id || normalizeString(c.name) === normalizeString(displayName));

                const xpCost = libDef?.xpCost != null ? libDef.xpCost : (sysDef?.xpCost ?? 0);
                const defaultValue = libDef?.defaultValue != null ? libDef.defaultValue : (sysDef?.defaultValue ?? 0);

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
    }, [onChange, onAddLog, recordXPTransaction, rules]);

    return { updateCounter };
};
