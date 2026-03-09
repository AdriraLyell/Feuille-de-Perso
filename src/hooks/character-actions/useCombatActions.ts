import { useCallback } from 'react';
import { CharacterSheetData } from '../../types/character';

export const useCombatActions = (
    onChange: (update: (prev: CharacterSheetData) => CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void
) => {
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

    return { updateCombatWeapon, updateArmor };
};
