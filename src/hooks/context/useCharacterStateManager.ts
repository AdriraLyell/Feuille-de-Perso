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

import { SheetLayout } from '../../hooks/useSheetLayout';
import { generateDefaultLayout } from '../../utils/layoutUtils';

interface UseCharacterStateManagerResult {
  resetData: () => void;
  importData: (newData: CharacterSheetData) => void;
  setEditMode: (active: boolean) => void;
  clearLayout: (portrait: SheetLayout, landscape: SheetLayout) => void;
  autoFitLayout: (colCount: number, availableHeightRows: number) => void;
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
  // IMPORTANT: We serialize library deps to strings to prevent infinite loops.
  // Without this, reconciliation deep-clones data (new object refs) → XP effect fires (deps changed)
  // → XP updates experience → new data object → reconciliation deps see new refs → loop.
  const specLibJson = JSON.stringify(data.specializationLibrary ?? []);
  const skillLibJson = JSON.stringify(data.skillLibrary ?? []);
  const traitLibJson = JSON.stringify(data.library ?? []);

  useEffect(() => {
    if (!rules) return;

    // Optimized Reconciliation:
    // Reconcile if either the version ID or the last updated timestamp has changed.
    if (data._rulesVersion === rules.version &&
      data._rulesLastUpdated === rules.lastUpdated &&
      data.appVersion === APP_VERSION &&
      specLibJson === localStorage.getItem('last-spec-lib-sync') &&
      skillLibJson === localStorage.getItem('last-skill-lib-sync') &&
      traitLibJson === localStorage.getItem('last-trait-lib-sync')
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

  }, [rules, data._rulesVersion, specLibJson, skillLibJson, traitLibJson]);

  const clearLayout = useCallback((portrait: SheetLayout, landscape: SheetLayout) => {
    setData(prev => ({
      ...prev,
      activeLayout: {
        lg: generateDefaultLayout(landscape, true),
        sm: generateDefaultLayout(portrait, false)
      }
    }));
  }, [setData]);

  const autoFitLayout = useCallback((colCount: number, availableHeightRows: number) => {
    setData(prev => {
      const isLandscape = colCount === 5;
      const currentLayout = isLandscape ? [...(prev.activeLayout?.lg || [])] : [...(prev.activeLayout?.sm || [])];

      if (!currentLayout.length) return prev;

      // Group items by column (x)
      const cols: Record<number, any[]> = {};
      for (const item of currentLayout) {
        if (item.i === 'counters_section') continue;
        const x = item.x;
        if (!cols[x]) cols[x] = [];
        cols[x].push({ ...item });
      }

      // We'll mutate based on currentLayout which is already cloned
      const newLayout = currentLayout.map(item => ({ ...item }));

      // Process each column independently
      for (let x = 0; x < colCount; x++) {
        const columnItems = cols[x] || [];
        if (columnItems.length === 0) continue;

        // Sort items by original y to maintain vertical order
        columnItems.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));

        // Calculate IDEAL heights in rows
        const idealHeights = columnItems.map(item => {
          let itemCount = 0;
          const cat = item.i;

          // Find count for this category
          const skillGroup = prev.skills[cat];
          if (skillGroup) itemCount = skillGroup.length;

          // Header (28px) + Padding/Margins (8px) = 36px. Each row is 20px. Grid row is 24px.
          // Formula: ceil((36 + itemCount * 20) / 24).
          // Minimum of 3 rows for aesthetic reasons, or 5 if empty placeholder exists.
          const needs = (itemCount === 0) ? 116 : (36 + itemCount * 20);
          return Math.max(3, Math.ceil(needs / 24));
        });

        const totalIdeal = idealHeights.reduce((a, b) => a + b, 0);

        // Adjust heights to fit budget
        let finalHeights: number[];
        if (totalIdeal <= availableHeightRows) {
          // Extension/Natural fit
          finalHeights = idealHeights;
        } else {
          // Compression (Proportional shrinking)
          // Budget = availableHeightRows
          finalHeights = idealHeights.map(h => {
            const share = Math.floor((h / totalIdeal) * availableHeightRows);
            return Math.max(3, share);
          });

          // Fill rounding gaps
          let currentSum = finalHeights.reduce((a, b) => a + b, 0);
          while (currentSum < availableHeightRows) {
            let maxDiff = -1;
            let indexToFill = -1;
            for (let i = 0; i < finalHeights.length; i++) {
              const diff = idealHeights[i] - finalHeights[i];
              if (diff > maxDiff) {
                maxDiff = diff;
                indexToFill = i;
              }
            }
            if (indexToFill !== -1) {
              finalHeights[indexToFill]++;
              currentSum++;
            } else break;
          }
        }

        // Apply new h and y to stacking
        let currentY = 0;
        for (let i = 0; i < columnItems.length; i++) {
          const item = columnItems[i];
          const actualItem = newLayout.find(li => li.i === item.i);
          if (actualItem) {
            let h = finalHeights[i];

            // If it's the last item in the column, extend it to fill available space
            // This ensures blocks like "Knowledge" or "Other Skills" reach the bottom
            if (i === columnItems.length - 1) {
              const remainingBudget = availableHeightRows - currentY;
              if (remainingBudget > h) {
                h = remainingBudget;
              }
            }

            actualItem.h = h;
            actualItem.y = currentY;
            currentY += h;
          }
        }
      }

      // Finally, ensure counters_section and other items don't overlap if they were pushed
      // Actually, since we only touch skill blocks, we should probably stick counters to the bottom of the grid
      const countersItem = newLayout.find(li => li.i === 'counters_section');
      if (countersItem) {
        // Find max Y across all columns
        let maxY = 0;
        for (const it of newLayout) {
          if (it.i !== 'counters_section') {
            const end = (it.y ?? 0) + (it.h ?? 0);
            if (end > maxY) maxY = end;
          }
        }
        // Let's place it right after the longest column but at least at availableHeightRows
        // We set y to availableHeightRows to leave space if something was compressed
        countersItem.y = Math.max(maxY, availableHeightRows);
      }

      return {
        ...prev,
        activeLayout: isLandscape
          ? { ...prev.activeLayout, lg: newLayout }
          : { ...prev.activeLayout, sm: newLayout }
      };
    });
  }, [setData]);

  return {
    isEditMode,
    resetData,
    importData,
    clearLayout,
    autoFitLayout,
    setEditMode: setIsEditMode
  };
};