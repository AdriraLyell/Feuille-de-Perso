import { CharacterSheetData } from '../types';
import { getInitialCharacterData, INITIAL_DATA } from '../data/initialState';
import { migrateData } from '../utils/migrations';
import { validateCharacterData } from '../schemas/characterSchema';
import { ErrorService } from '../services/ErrorService';

export const loadInitialCharacterData = (): CharacterSheetData => {
    const saved = localStorage.getItem('rpg-sheet-data');

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const migrated = migrateData(parsed);

            // Validate after migration
            const validated = validateCharacterData(migrated);

            if (validated.creationConfig) {
                validated.creationConfig.active = false;
            }

            // Restore Local Settings
            if (validated.syncInfo?.localSettings) {
                const { expertMode, activeRulesId } = validated.syncInfo.localSettings;
                if (expertMode !== undefined) localStorage.setItem('rpg-sheet-expert-mode', String(expertMode));
                if (activeRulesId !== undefined) localStorage.setItem('rules-source-id', activeRulesId);
            }

            // SYNCHRONIZATION FIX: Force the active setting ID to match the loaded character
            // This prevents RulesContext from fetching an old campaign on F5 refresh.
            if (validated.syncInfo?.settingId && validated.syncInfo.settingId !== 'orphan') {
                localStorage.setItem('rpg-active-setting-id', validated.syncInfo.settingId);
            }

            // Force reconciliation if skillLibrary was emptied (fixes mysticAbilityId loss)
            if (!validated.skillLibrary || validated.skillLibrary.length === 0) {
                validated._rulesVersion = undefined;
                validated._rulesLastUpdated = undefined;
            }

            return validated;
        } catch (e) {
            ErrorService.handleError(e, { context: 'CharacterContext.Init', userMessage: "Erreur lors du chargement des données locales." });
            // Try to just migrate if validation fails, or fallback to initial
            try {
                return migrateData(JSON.parse(saved));
            } catch (migrateError) {
                ErrorService.handleError(migrateError, { context: 'CharacterContext.Init.Fallback', silent: true });
                return INITIAL_DATA;
            }
        }
    }

    // For fresh initialization, use getInitialCharacterData directly to ensure unique IDs
    return getInitialCharacterData();
};
