import { useCallback } from 'react';
import { CharacterSheetData, XPTransaction } from '../../types';

export const useAttributeActions = (
    data: CharacterSheetData,
    onChange: (update: (prev: CharacterSheetData) => CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void,
    recordXPTransaction: (transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => void
) => {
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
    }, [onChange, onAddLog, recordXPTransaction]);

    return { updateAttribute };
};
