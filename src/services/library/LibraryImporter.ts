import { DatabaseService } from '../DatabaseService';
import { LibraryEntry as LibraryTraitEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryBackgroundEntry, LibraryCounterEntry } from '../../types/system';
import { ErrorService } from '../ErrorService';

const ensureUUID = (id: string | undefined): string => {
    if (!id) return crypto.randomUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) return id;
    console.warn(`[LibraryImporter] Legacy ID detected (${id}), replacing with UUID`);
    return crypto.randomUUID();
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

        const inserted = await DatabaseService.insert('libraries_traits', payload, 'LibraryImporter.importTraits');
        if (!inserted) return false;

        // Auto-link if global import but triggered from a campaign
        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, trait_id: p.id, is_active: true }));
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

        const inserted = await DatabaseService.insert('libraries_skills', payload, 'LibraryImporter.importSkills');
        if (!inserted) return false;

        // Auto-link if global
        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, skill_id: p.id, is_active: true }));
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

        const inserted = await DatabaseService.insert('libraries_specializations', payload, 'LibraryImporter.importSpecializations');
        if (!inserted) return false;

        // Auto-link if global
        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, specialization_id: p.id, is_active: true }));
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

        const inserted = await DatabaseService.insert('libraries_backgrounds', payload, 'LibraryImporter.importBackgrounds');
        if (!inserted) return false;

        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, background_id: p.id, is_active: true }));
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

        const inserted = await DatabaseService.insert('libraries_counters', payload, 'LibraryImporter.importCounters');
        if (!inserted) return false;

        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, counter_id: p.id, is_active: true }));
            await DatabaseService.insert('rel_setting_counters', relPayload, 'LibraryImporter.importCounters.link');
        }

        return true;
    }
};
