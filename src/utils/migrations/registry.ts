

// Import migration functions
import { migrateTerminology } from './migrateTerminology';
import { migrateTraits } from './migrateTraits';
import { migrateCounters } from './migrateCounters';
import { migrateAttributes } from './migrateAttributes';
import { migrateNotebook } from './migrateNotebook';
import { migrateLibrary } from './migrateLibrary';
import { migrateSpecializations } from './migrateSpecializations';
import { migrateSkills } from './migrateSkills';
import { migrateDefaults } from './migrateDefaults';
import { migrateCampaignNotes } from './migrateCampaignNotes';
import { migrateHeaderDates } from './migrateHeaderDates';
import { migrateFormulas } from './migrateFormulas';
import { forceRulesReconciliation } from './forceRulesReconciliation';
import { restoreMysticLinks } from './restoreMysticLinks';
import { migrateLayoutConfig } from './migrateLayoutConfig';

// Type for data being migrated (starts as raw JSON, ends as CharacterSheetData)
export type MigratableData = Record<string, unknown>;

// Type for a migration function
type MigrationFunction = (data: MigratableData) => void;


// Registry of migrations by version
// Version 1 corresponds to "Legacy to Current" massive migration
export const MIGRATIONS: Record<number, MigrationFunction[]> = {
    1: [
        migrateTerminology,
        migrateTraits,
        migrateCounters,
        migrateAttributes,
        migrateNotebook,
        migrateLibrary,
        migrateSpecializations,
        migrateSkills,
        migrateDefaults
    ],
    2: [
        migrateCampaignNotes
    ],
    3: [
        migrateHeaderDates
    ],
    4: [
        migrateFormulas
    ],
    5: [
        forceRulesReconciliation
    ],
    6: [
        forceRulesReconciliation  // Re-force after reconcileCleanup fix (re-injects skillLibrary with mysticAbilityId)
    ],
    7: [
        restoreMysticLinks
    ],
    8: [
        migrateLayoutConfig
    ]
};

export const CURRENT_SCHEMA_VERSION = 8;

