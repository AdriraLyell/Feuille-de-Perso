import { DatabaseService } from '../DatabaseService';
import { LibraryEntry as LibraryTraitEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryBackgroundEntry, LibraryCounterEntry } from '../../types/system';
import { ErrorService } from '../ErrorService';

import { normalizeString } from '../../utils/stringUtils';
import { logger } from '../../utils/logger';

const ensureUUID = (id: string | undefined): string => {
    if (!id) return crypto.randomUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) return id;
    logger.warn(`[LibraryImporter] Legacy ID detected (${id}), replacing with UUID`);
    return crypto.randomUUID();
};

// Helper to check duplicates against DB
const filterDuplicates = async <T extends { name: string }>(table: string, targetId: string | null, newItems: T[]): Promise<T[]> => {
    if (newItems.length === 0) return [];

    // Check both ID and Name to be safe
    const query = targetId ? { eq: { setting_id: targetId } } : { eq: { setting_id: null } };

    // We fetch existing names.
    // Note: This isn't perfect if names are very similar but not identical, but `normalizeString` helps.
    const existing = await DatabaseService.fetchAll<{ name: string }>(table, { ...query, select: 'name' }, 'LibraryImporter.checkDupes');
    const existingNames = new Set(existing.map(e => normalizeString(e.name)));

    return newItems.filter(item => !existingNames.has(normalizeString(item.name)));
};

export const LibraryImporter = {
    /**
     * Partial Imports: Add items to libraries without overwriting existing ones.
     */
    async importTraits(targetId: string | null, traits: LibraryTraitEntry[], linkToSettingId?: string): Promise<boolean> {
        if (traits.length === 0) return true;
        const payload = traits.map(t => ({
            setting_id: targetId,
            id: ensureUUID(t.id),
            type: t.type,
            name: t.name,
            cost: t.cost,
            description: t.description || '',
            tags: t.tags || [],
            is_variable: t.isVariable || false,
            effects: t.effects || []
        }));

        const uniquePayload = await filterDuplicates('libraries_traits', targetId, payload);

        // If nothing new to insert, we can still proceed to check links if needed, 
        // but typically we only link what we just inserted or if we know it exists.
        // However, if it was a duplicate, it implies it's already there. 
        // For simplicity and safety (avoiding duplicate primary key errors if we tried to re-insert), we only insert unique.

        let result = true;
        if (uniquePayload.length > 0) {
            result = !!(await DatabaseService.insert('libraries_traits', uniquePayload, 'LibraryImporter.importTraits'));
        }

        if (!result) return false;

        // Auto-link if global import but triggered from a campaign
        // Only link the ones we intended to import (even if they were duplicates, we might want to link them? 
        // The original logic only linked what was *inserted*). 
        // The prompt implies we want to prevent adding *duplicates* to the library.
        // If it's already in the library, rel-linking it might be redundant or handled elsewhere?
        // Let's stick to linking only what we successfully processed (or verified as existing?).
        // Actually, if it's a duplicate, it means it exists. We might still want to link it if `linkToSettingId` is provided.
        // But `uniquePayload` only contains NEW items.
        // If we want to link EXISTING items too, we'd need their IDs.
        // For now, let's stick to the pattern: Only insert and link validation for NEW items.
        // (If the user wants to link an existing global item, that's a different operation usually).

        if (targetId === null && linkToSettingId && uniquePayload.length > 0) {
            const relPayload = uniquePayload.map(p => ({ setting_id: linkToSettingId, trait_id: p.id, is_active: true }));
            await DatabaseService.insert('rel_setting_traits', relPayload, 'LibraryImporter.importTraits.link');
        }

        return true;
    },

    async importSkills(targetId: string | null, skills: LibrarySkillEntry[], linkToSettingId?: string): Promise<boolean> {
        if (skills.length === 0) return true;

        const payload = skills.map(s => ({
            setting_id: targetId,
            id: ensureUUID(s.id),
            name: s.name,
            description: s.description,
            default_category: s.defaultCategory,
            is_variable: s.isVariable
        }));

        const uniquePayload = await filterDuplicates('libraries_skills', targetId, payload);

        let result = true;
        if (uniquePayload.length > 0) {
            result = !!(await DatabaseService.insert('libraries_skills', uniquePayload, 'LibraryImporter.importSkills'));
        }
        if (!result) return false;

        // Auto-link if global
        if (targetId === null && linkToSettingId && uniquePayload.length > 0) {
            const relPayload = uniquePayload.map(p => ({ setting_id: linkToSettingId, skill_id: p.id, is_active: true }));
            await DatabaseService.insert('rel_setting_skills', relPayload, 'LibraryImporter.importSkills.link');
        }

        return true;
    },

    async importSpecializations(targetId: string | null, specs: LibrarySpecializationEntry[], linkToSettingId?: string): Promise<boolean> {
        if (specs.length === 0) return true;
        const payload = specs.map(s => ({
            setting_id: targetId,
            id: ensureUUID(s.id),
            name: s.name,
            description: s.description,
            skill_ids: s.skillIds || [],
            default_min_level: s.defaultMinLevel || 1
        }));

        const uniquePayload = await filterDuplicates('libraries_specializations', targetId, payload);

        let result = true;
        if (uniquePayload.length > 0) {
            result = !!(await DatabaseService.insert('libraries_specializations', uniquePayload, 'LibraryImporter.importSpecializations'));
        }
        if (!result) return false;

        // Auto-link if global
        if (targetId === null && linkToSettingId && uniquePayload.length > 0) {
            const relPayload = uniquePayload.map(p => ({ setting_id: linkToSettingId, specialization_id: p.id, is_active: true }));
            await DatabaseService.insert('rel_setting_specializations', relPayload, 'LibraryImporter.importSpecializations.link');
        }

        return true;
    },

    async importBackgrounds(targetId: string | null, backgrounds: LibraryBackgroundEntry[], linkToSettingId?: string): Promise<boolean> {
        if (backgrounds.length === 0) return true;
        const payload = backgrounds.map(b => ({
            setting_id: targetId,
            id: ensureUUID(b.id),
            name: b.name,
            description: b.description,
            is_variable: b.isVariable || false
        }));

        const uniquePayload = await filterDuplicates('libraries_backgrounds', targetId, payload);

        let result = true;
        if (uniquePayload.length > 0) {
            result = !!(await DatabaseService.insert('libraries_backgrounds', uniquePayload, 'LibraryImporter.importBackgrounds'));
        }
        if (!result) return false;

        if (targetId === null && linkToSettingId && uniquePayload.length > 0) {
            const relPayload = uniquePayload.map(p => ({ setting_id: linkToSettingId, background_id: p.id, is_active: true }));
            await DatabaseService.insert('rel_setting_backgrounds', relPayload, 'LibraryImporter.importBackgrounds.link');
        }

        return true;
    },

    async importCounters(targetId: string | null, counters: LibraryCounterEntry[], linkToSettingId?: string): Promise<boolean> {
        if (counters.length === 0) return true;
        const payload = counters.map(c => ({
            setting_id: targetId,
            id: ensureUUID(c.id),
            name: c.name,
            description: c.description,
            max_value: c.maxValue || 10,
            default_value: c.defaultValue || 0,
            xp_cost: c.xpCost || 0
        }));

        const uniquePayload = await filterDuplicates('libraries_counters', targetId, payload);

        let result = true;
        if (uniquePayload.length > 0) {
            result = !!(await DatabaseService.insert('libraries_counters', uniquePayload, 'LibraryImporter.importCounters'));
        }
        if (!result) return false;

        if (targetId === null && linkToSettingId && uniquePayload.length > 0) {
            const relPayload = uniquePayload.map(p => ({ setting_id: linkToSettingId, counter_id: p.id, is_active: true }));
            await DatabaseService.insert('rel_setting_counters', relPayload, 'LibraryImporter.importCounters.link');
        }

        return true;
    }
};
