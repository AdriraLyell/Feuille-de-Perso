
import { CharacterSheetData, LibraryEntry } from '../types';
import { RulesData } from '../types/rules';
import { migrateTraitLibrary } from './migrations/migrateTraitProperties';

import { reconcileConfigurations } from './reconcilers/configurationsReconciler';
import { reconcileAttributes, reconcileSecondaryAttributes } from './reconcilers/attributesReconciler';
import { reconcileSkillsAndBackgrounds } from './reconcilers/skillsReconciler';
import { reconcileCounters } from './reconcilers/countersReconciler';
import { reconcileTraits, reconcileCleanup } from './reconcilers/traitsReconciler';
import { reconcileHeader } from './reconcilers/headerReconciler';
import { reconcileImposedSpecializations } from './reconcilers/imposedSpecializationsReconciler';
import { reconcileLayout } from './reconcilers/layoutReconciler';
import { getInitialCharacterData } from '../data/initialState';
import { getDynamicColumnsStatic } from './layoutGenerationUtils';

/**
 * Main function to reconcile a character state with a set of rules.
 * Creates a deep clone of the current state and sequentially applies all sub-reconcilers.
 * 
 * @param currentState - Current character sheet data
 * @param rules - New ruleset to apply
 * @returns A new reconciled character sheet state
 */
export const reconcileRulesWithState = (currentState: CharacterSheetData, rules: RulesData): CharacterSheetData => {
    const newState: CharacterSheetData = JSON.parse(JSON.stringify(currentState));

    // --- Data Migration (In-Memory) ---
    if (rules.libraries?.traits) {
        rules.libraries.traits = migrateTraitLibrary(rules.libraries.traits as LibraryEntry[]).traits;
    }

    if (rules.version) {
        newState._rulesVersion = rules.version;
    }

    reconcileConfigurations(newState, rules);
    reconcileAttributes(newState, rules);
    reconcileSecondaryAttributes(newState, rules);
    reconcileSkillsAndBackgrounds(newState, currentState, rules);
    reconcileCounters(newState, currentState, rules);
    reconcileTraits(newState, currentState, rules);
    reconcileImposedSpecializations(newState, rules);
    reconcileCleanup(newState, currentState, rules);
    reconcileHeader(newState, rules);

    // Dynamic layout reconciliation
    const portraitLayout = getDynamicColumnsStatic(newState, rules, false);
    const landscapeLayout = getDynamicColumnsStatic(newState, rules, true);
    reconcileLayout(newState, portraitLayout, landscapeLayout);

    return newState;
};
