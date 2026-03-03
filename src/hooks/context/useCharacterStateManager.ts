import { useState, useEffect, useCallback } from 'react';
import { CharacterSheetData } from '../../types';
import { getInitialCharacterData } from '../../data/initialState';
import { migrateData } from '../../utils/migrations';
import { validateCharacterData } from '../../schemas/characterSchema';
import { useRules } from '../../context/RulesContext';
import { applyRulesToState } from '../../utils/rulesAdapter';
import { reconcileRulesWithState } from '../../utils/rulesReconciler';
import { ErrorService } from '../../services/ErrorService';
import { APP_VERSION } from '../../constants/app';
import { logger } from '../../utils/logger';

interface UseCharacterStateManagerResult {
  resetData: () => void;
  importData: (newData: CharacterSheetData) => void;
  setEditMode: (active: boolean) => void;
  isEditMode: boolean;
}

export const useCharacterStateManager = (
  data: CharacterSheetData,
  setData: React.Dispatch<React.SetStateAction<CharacterSheetData>>
): UseCharacterStateManagerResult => {
  const { rules } = useRules();
  const [isEditMode, setIsEditMode] = useState(false);

  // Actions (Stable references via useCallback)
  const resetData = useCallback(() => {
    // Use factory to get fresh IDs
    const base = getInitialCharacterData();
    // Apply rules if available
    const newState = rules ? applyRulesToState(base, rules) : base;

    setData(newState);
  }, [rules, setData]);

  const importData = useCallback((newData: CharacterSheetData) => {
    try {
      const migrated = migrateData(newData);
      const validated = validateCharacterData(migrated);

      // Reconcile with current rules if available to ensure MJ definitions are applied
      const sanitizedData = {
        ...validated,
        mysticAbilities: validated.mysticAbilities || []
      } as CharacterSheetData;
      const finalData = rules ? reconcileRulesWithState(sanitizedData, rules) : sanitizedData;

      // Restore Local Settings from Imported Data
      if (finalData.syncInfo?.localSettings) {
        const { expertMode, activeRulesId } = finalData.syncInfo.localSettings;
        if (expertMode !== undefined) localStorage.setItem('rpg-sheet-expert-mode', String(expertMode));
        if (activeRulesId !== undefined) {
          localStorage.setItem('rules-source-id', activeRulesId as string);
        }
      }

      setData(finalData);
    } catch (e) {
      ErrorService.handleError(e, { context: 'CharacterContext.Import', userMessage: "Le fichier importé est invalide." });
    }
  }, [rules, setData]);

  // Save to localStorage effect
  useEffect(() => {
    // Prepare data with latest local settings before saving
    const expertMode = localStorage.getItem('rpg-sheet-expert-mode') === 'true';
    const activeRulesId = localStorage.getItem('rules-source-id') || undefined;

    const dataWithSettings = {
      ...data,
      syncInfo: {
        ...data.syncInfo,
        localSettings: {
          expertMode,
          activeRulesId
        }
      }
    };

    localStorage.setItem('rpg-sheet-data', JSON.stringify(dataWithSettings));
  }, [data]);

  // Auto-Update Effect (Smart Re-Hydration)
  useEffect(() => {
    if (!rules) return;

    // Optimized Reconciliation:
    // Reconcile if either the version ID or the last updated timestamp has changed.
    // This ensures updates are caught even if the semantic version string isn't manually bumped.
    if (data._rulesVersion === rules.version &&
      data._rulesLastUpdated === rules.lastUpdated &&
      data.appVersion === APP_VERSION &&
      // Check if local libraries have changed (using simple stringification as a quick structural equality check)
      JSON.stringify(data.specializationLibrary) === localStorage.getItem('last-spec-lib-sync') &&
      JSON.stringify(data.skillLibrary) === localStorage.getItem('last-skill-lib-sync') &&
      JSON.stringify(data.library) === localStorage.getItem('last-trait-lib-sync')
    ) {
      return;
    }

    setData(currentData => {
      if (currentData._rulesVersion === rules.version &&
        currentData._rulesLastUpdated === rules.lastUpdated &&
        JSON.stringify(currentData.specializationLibrary) === localStorage.getItem('last-spec-lib-sync') &&
        JSON.stringify(currentData.skillLibrary) === localStorage.getItem('last-skill-lib-sync') &&
        JSON.stringify(currentData.library) === localStorage.getItem('last-trait-lib-sync')
      ) {
        return currentData;
      }

      try {
        const skillsBefore = Object.values(currentData.skills).flat().filter(s => s.name).length;
        logger.log(`[CharacterContext] Reconciling with rules v${rules.version} (last updated: ${rules.lastUpdated}). Skills before: ${skillsBefore}`);

        const newData = reconcileRulesWithState(currentData, rules);
        newData._rulesLastUpdated = rules.lastUpdated;

        // Update sync markers
        localStorage.setItem('last-spec-lib-sync', JSON.stringify(newData.specializationLibrary || []));
        localStorage.setItem('last-skill-lib-sync', JSON.stringify(newData.skillLibrary || []));
        localStorage.setItem('last-trait-lib-sync', JSON.stringify(newData.library || []));

        const skillsAfter = Object.values(newData.skills).flat().filter(s => s.name).length;
        logger.log(`[CharacterContext] Reconciliation complete. Skills after: ${skillsAfter}`);

        if (skillsAfter < skillsBefore && skillsBefore > 0) {
          logger.warn(`[CharacterContext] Skills count dropped from ${skillsBefore} to ${skillsAfter}! Check rules for missing definitions.`);
        }

        return newData;
      } catch (e) {
        ErrorService.handleError(e, { context: 'CharacterContext.Reconciliation', userMessage: "Erreur critique lors de la mise à jour des règles." });
        return currentData; // Prevent crash, keep old data
      }
    });

  }, [rules, data._rulesVersion, data.specializationLibrary, data.skillLibrary, data.library]);

  return {
    isEditMode,
    resetData,
    importData,
    setEditMode: setIsEditMode
  };
};