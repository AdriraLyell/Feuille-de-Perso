import { RulesData } from '../types/rules';
import { LibraryEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryBackgroundEntry, LibraryCounterEntry } from '../types/system';
import { LibraryPersistence } from './library/LibraryPersistence';
import { LibraryLoader } from './library/LibraryLoader';
import { LibraryImporter } from './library/LibraryImporter';

export const LibraryService = {
    /**
     * Persist initial libraries for a new setting
     */
    async persistInitialLibraries(settingId: string, initialRules: Partial<RulesData>) {
        return LibraryPersistence.persistInitialLibraries(settingId, initialRules);
    },

    /**
     * Load libraries for a specific setting and map them to RulesData format
     */
    async loadLibraries(settingId: string): Promise<RulesData['libraries']> {
        return LibraryLoader.loadLibraries(settingId);
    },

    /**
     * Delete and Re-insert libraries (Standard Sync Strategy)
     */
    async syncLibraries(settingId: string, rules: RulesData) {
        return LibraryPersistence.syncLibraries(settingId, rules);
    },

    /**
     * Partial Imports: Add items to libraries without overwriting existing ones.
     */
    async importTraits(targetId: string | null, traits: LibraryEntry[], linkToSettingId?: string): Promise<boolean> {
        return LibraryImporter.importTraits(targetId, traits, linkToSettingId);
    },

    async importSkills(targetId: string | null, skills: LibrarySkillEntry[], linkToSettingId?: string): Promise<boolean> {
        return LibraryImporter.importSkills(targetId, skills, linkToSettingId);
    },

    async importSpecializations(targetId: string | null, specs: LibrarySpecializationEntry[], linkToSettingId?: string): Promise<boolean> {
        return LibraryImporter.importSpecializations(targetId, specs, linkToSettingId);
    },

    async importBackgrounds(targetId: string | null, backgrounds: LibraryBackgroundEntry[], linkToSettingId?: string): Promise<boolean> {
        return LibraryImporter.importBackgrounds(targetId, backgrounds, linkToSettingId);
    },

    async importCounters(targetId: string | null, counters: LibraryCounterEntry[], linkToSettingId?: string): Promise<boolean> {
        return LibraryImporter.importCounters(targetId, counters, linkToSettingId);
    }
};
