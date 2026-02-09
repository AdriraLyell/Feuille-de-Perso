import { supabase } from '../supabase';
import { DatabaseService } from '../DatabaseService';
import { RulesData } from '../../types/rules';
import { LibraryMapper } from './LibraryMapper';

export const LibraryLoader = {
    /**
     * Load libraries for a specific setting and map them to RulesData format
     */
    async loadLibraries(settingId: string): Promise<RulesData['libraries']> {
        const orFilter = `setting_id.eq.${settingId},setting_id.is.null`;

        const [
            traits, skills, specs,
            relTraits, relSkills, relSpecs,
            backgrounds, relBackgrounds, counters, relCounters,
            traitVariants, skillVariants, bgVariants
        ] = await Promise.all([
            DatabaseService.fetchAll<any>('libraries_traits', { or: orFilter }, 'LibraryLoader.loadTraits'),
            DatabaseService.fetchAll<any>('libraries_skills', { or: orFilter }, 'LibraryLoader.loadSkills'),
            DatabaseService.fetchAll<any>('libraries_specializations', { or: orFilter }, 'LibraryLoader.loadSpecs'),
            DatabaseService.fetchAll<any>('rel_setting_traits', { eq: { setting_id: settingId } }, 'LibraryLoader.relTraits'),
            DatabaseService.fetchAll<any>('rel_setting_skills', { eq: { setting_id: settingId } }, 'LibraryLoader.relSkills'),
            DatabaseService.fetchAll<any>('rel_setting_specializations', { eq: { setting_id: settingId } }, 'LibraryLoader.relSpecs'),
            DatabaseService.fetchAll<any>('libraries_backgrounds', { or: orFilter }, 'LibraryLoader.loadBackgrounds'),
            DatabaseService.fetchAll<any>('rel_setting_backgrounds', { eq: { setting_id: settingId } }, 'LibraryLoader.relBackgrounds'),
            DatabaseService.fetchAll<any>('libraries_counters', { or: orFilter }, 'LibraryLoader.loadCounters'),
            DatabaseService.fetchAll<any>('rel_setting_counters', { eq: { setting_id: settingId } }, 'LibraryLoader.relCounters'),
            DatabaseService.fetchAll<any>('libraries_traits_variants', { or: orFilter, select: 'trait_id, name' }, 'LibraryLoader.loadTraitsVariants'),
            DatabaseService.fetchAll<any>('libraries_skills_variants', { or: orFilter, select: 'skill_id, name' }, 'LibraryLoader.loadSkillsVariants'),
            DatabaseService.fetchAll<any>('libraries_backgrounds_variants', { or: orFilter, select: 'background_id, name' }, 'LibraryLoader.loadBgVariants')
        ]);

        const traitVarMap = new Map<string, string[]>();
        traitVariants.forEach((v: any) => {
            const list = traitVarMap.get(v.trait_id) || [];
            if (!list.includes(v.name)) {
                list.push(v.name);
                traitVarMap.set(v.trait_id, list);
            }
        });

        const skillVarMap = new Map<string, string[]>();
        skillVariants.forEach((v: any) => {
            const list = skillVarMap.get(v.skill_id) || [];
            if (!list.includes(v.name)) {
                list.push(v.name);
                skillVarMap.set(v.skill_id, list);
            }
        });

        const bgVarMap = new Map<string, string[]>();
        bgVariants.forEach((v: any) => {
            const list = bgVarMap.get(v.background_id) || [];
            if (!list.includes(v.name)) {
                list.push(v.name);
                bgVarMap.set(v.background_id, list);
            }
        });

        const activeTraitIds = new Set<string>(relTraits.map((r: any) => r.trait_id));
        const activeSkillIds = new Set<string>(relSkills.map((r: any) => r.skill_id));
        const activeSpecIds = new Set<string>(relSpecs.map((r: any) => r.specialization_id));
        const activeBgIds = new Set<string>(relBackgrounds.map((r: any) => r.background_id));
        const activeCounterIds = new Set<string>(relCounters.map((r: any) => r.counter_id));

        const skillDefaultMap = new Map<string, string>(relSkills.map((r: any) => [r.skill_id, r.default_category]));
        const bgDefaultMap = new Map<string, string>(relBackgrounds.map((r: any) => [r.background_id, r.default_category]));
        const counterDefaultMap = new Map<string, string>(relCounters.map((r: any) => [r.counter_id, r.default_category]));

        return {
            traits: traits.map((t: any) => LibraryMapper.mapTrait(t, activeTraitIds, settingId, traitVarMap.get(t.id))).sort((a: any, b: any) => a.name.localeCompare(b.name)),
            skills: skills.map((s: any) => LibraryMapper.mapSkill(s, activeSkillIds, settingId, skillVarMap.get(s.id), skillDefaultMap.get(s.id))).sort((a: any, b: any) => a.name.localeCompare(b.name)),
            specializations: specs.map((s: any) => LibraryMapper.mapSpec(s, activeSpecIds, settingId)).sort((a: any, b: any) => a.name.localeCompare(b.name)),
            backgrounds: backgrounds.map((b: any) => LibraryMapper.mapBackground(b, activeBgIds, settingId, bgVarMap.get(b.id), bgDefaultMap.get(b.id))).sort((a: any, b: any) => a.name.localeCompare(b.name)),
            counters: counters.map((c: any) => LibraryMapper.mapCounter(c, activeCounterIds, settingId, counterDefaultMap.get(c.id))).sort((a: any, b: any) => a.name.localeCompare(b.name))
        };
    },

    /**
     * Get usage statistics from all settings except the current one
     */
    async loadGlobalUsage(currentSettingId: string): Promise<Record<string, number>> {
        const tables = [
            { table: 'rel_setting_traits', id: 'trait_id', cat: false },
            { table: 'rel_setting_skills', id: 'skill_id', cat: true },
            { table: 'rel_setting_backgrounds', id: 'background_id', cat: true },
            { table: 'rel_setting_counters', id: 'counter_id', cat: true },
            { table: 'rel_setting_specializations', id: 'specialization_id', cat: false }
        ];

        const results = await Promise.all(tables.map(async t => {
            let query = supabase.from(t.table).select(`${t.id}, setting_id`);

            // Filter out current setting
            query = query.neq('setting_id', currentSettingId);

            // For tables with categories, only count "placed" items
            if (t.cat) {
                query = query.not('default_category', 'is', null);
            }

            const { data } = await query;
            return { idKey: t.id, data: data || [] };
        }));

        const usageMap: Record<string, number> = {};
        results.forEach(res => {
            res.data.forEach((row: any) => {
                const id = row[res.idKey];
                usageMap[id] = (usageMap[id] || 0) + 1;
            });
        });

        return usageMap;
    }
};
