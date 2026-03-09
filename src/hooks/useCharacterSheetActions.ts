import { XPTransaction } from '../types';
import { RulesData } from '../types/rules';
import { CharacterSheetData } from '../types/character';

import { useHeaderActions } from './character-actions/useHeaderActions';
import { useSkillActions } from './character-actions/useSkillActions';
import { useAttributeActions } from './character-actions/useAttributeActions';
import { useCombatActions } from './character-actions/useCombatActions';
import { useCounterActions } from './character-actions/useCounterActions';

/**
 * Hook centralisant toutes les actions de modification de la fiche de personnage.
 * Désormais scindé en sous-hooks spécialisés pour une meilleure maintenabilité.
 */
export const useCharacterSheetActions = (
    data: CharacterSheetData,
    onChange: (update: (prev: CharacterSheetData) => CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void,
    recordXPTransaction: (transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => void,
    rules: RulesData | null
) => {
    const { updateHeader } = useHeaderActions(onChange, onAddLog);

    const { updateDot, handleDropItem, handleRemoveItem } = useSkillActions(
        onChange,
        onAddLog,
        recordXPTransaction,
        rules
    );

    const { updateAttribute } = useAttributeActions(
        data,
        onChange,
        onAddLog,
        recordXPTransaction
    );

    const { updateCombatWeapon, updateArmor } = useCombatActions(onChange, onAddLog);

    const { updateCounter } = useCounterActions(
        onChange,
        onAddLog,
        recordXPTransaction,
        rules
    );

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
