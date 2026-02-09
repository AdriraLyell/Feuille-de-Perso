import { describe, it, expect } from 'vitest';
import { migrateData } from '../utils/migrations';
import { CURRENT_SCHEMA_VERSION } from '../utils/migrations/registry';

describe('Versioned Migrations', () => {

    it('should migrate legacy data (no version) to current version', () => {
        const legacyData = {
            header: { name: 'Legacy Char' },
            skills: {},
            // Missing _schemaVersion
        };

        const migrated = migrateData(legacyData);

        expect(migrated._schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should not modify data if version is already up to date', () => {
        const currentData = {
            header: { name: 'Up To Date Char' },
            _schemaVersion: CURRENT_SCHEMA_VERSION,
            // Mock some data that *would* be touched by migration if it ran again
            // e.g. terminology "vertus" shouldn't change if it's already "avantages"
            // But here we rely on the function returning early.
        };

        // Spy on console.log/debug would be better, but testing returned object reference or identity is good enough
        // migrateData returns shallow copy if it migrates, or same object if not?
        // Actually implementation: returns "parsed as CharacterSheetData" if up to date.

        const result = migrateData(currentData);
        expect(result).toBe(currentData); // Strict equality check
    });

    it('should be idempotent (running migration twice is safe)', () => {
        const legacyData = {
            header: { name: 'Legacy Char' },
            skills: {},
        };

        const firstPass = migrateData(legacyData);
        expect(firstPass._schemaVersion).toBe(CURRENT_SCHEMA_VERSION);

        const secondPass = migrateData(firstPass);
        expect(secondPass).toBe(firstPass); // Should return same object immediately
        expect(secondPass._schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });
});
