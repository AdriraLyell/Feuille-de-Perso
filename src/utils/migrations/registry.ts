import { CharacterSheetData } from '../../types';

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

// Type for a migration function
type MigrationFunction = (data: any) => void;

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
    ]
};

export const CURRENT_SCHEMA_VERSION = 1;
