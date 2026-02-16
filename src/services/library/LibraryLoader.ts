import { supabase } from '../supabase';
import { DatabaseService } from '../DatabaseService';
import { RulesData } from '../../types/rules';
import { LibraryMapper } from './LibraryMapper';
import { ErrorService } from '../ErrorService';
import {
    DBTrait, DBSkill, DBSpecialization, DBBackground, DBCounter, DBMysticAbility,
    RelSettingTrait, RelSettingSkill, RelSettingSpecialization,
    RelSettingBackground, RelSettingCounter, RelSettingMysticAbility,
    DBTraitVariant, DBSkillVariant, DBBackgroundVariant
} from '../../types/database';
import {
    TABLE_LIBRARIES_TRAITS, TABLE_LIBRARIES_SKILLS, TABLE_LIBRARIES_SPECIALIZATIONS, TABLE_LIBRARIES_BACKGROUNDS, TABLE_LIBRARIES_COUNTERS, TABLE_LIBRARIES_MYSTIC_ABILITIES,
    TABLE_REL_SETTING_TRAITS, TABLE_REL_SETTING_SKILLS, TABLE_REL_SETTING_SPECIALIZATIONS, TABLE_REL_SETTING_BACKGROUNDS, TABLE_REL_SETTING_COUNTERS, TABLE_REL_SETTING_MYSTIC_ABILITIES,
    TABLE_LIBRARIES_TRAITS_VARIANTS, TABLE_LIBRARIES_SKILLS_VARIANTS, TABLE_LIBRARIES_BACKGROUNDS_VARIANTS
} from '../../constants/db';

export const LibraryLoader = {
    /**
     * Load libraries for a specific setting and map them to RulesData format
     */
    async loadLibraries(settingId: string): Promise<RulesData['libraries']> {
        const orFilter = `setting_id.eq.${settingId},setting_id.is.null`;

        try {
            const [
                traits, skills, specs,
                relTraits, relSkills, relSpecs,
                backgrounds, relBackgrounds, counters, relCounters,
                traitVariants, skillVariants, bgVariants,
                mysticAbilities, relMysticAbilities
            ] = await Promise.all([
                DatabaseService.fetchAll<DBTrait>(TABLE_LIBRARIES_TRAITS, { or: orFilter }, 'LibraryLoader.loadTraits'),
                DatabaseService.fetchAll<DBSkill>(TABLE_LIBRARIES_SKILLS, { or: orFilter }, 'LibraryLoader.loadSkills'),
                DatabaseService.fetchAll<DBSpecialization>(TABLE_LIBRARIES_SPECIALIZATIONS, { or: orFilter }, 'LibraryLoader.loadSpecs'),
                DatabaseService.fetchAll<RelSettingTrait>(TABLE_REL_SETTING_TRAITS, { eq: { setting_id: settingId } }, 'LibraryLoader.relTraits'),
                DatabaseService.fetchAll<RelSettingSkill>(TABLE_REL_SETTING_SKILLS, { eq: { setting_id: settingId } }, 'LibraryLoader.relSkills'),
                DatabaseService.fetchAll<RelSettingSpecialization>(TABLE_REL_SETTING_SPECIALIZATIONS, { eq: { setting_id: settingId } }, 'LibraryLoader.relSpecs'),
                DatabaseService.fetchAll<DBBackground>(TABLE_LIBRARIES_BACKGROUNDS, { or: orFilter }, 'LibraryLoader.loadBackgrounds'),
                DatabaseService.fetchAll<RelSettingBackground>(TABLE_REL_SETTING_BACKGROUNDS, { eq: { setting_id: settingId } }, 'LibraryLoader.relBackgrounds'),
                DatabaseService.fetchAll<DBCounter>(TABLE_LIBRARIES_COUNTERS, { or: orFilter }, 'LibraryLoader.loadCounters'),
                DatabaseService.fetchAll<RelSettingCounter>(TABLE_REL_SETTING_COUNTERS, { eq: { setting_id: settingId } }, 'LibraryLoader.relCounters'),
                DatabaseService.fetchAll<DBTraitVariant>(TABLE_LIBRARIES_TRAITS_VARIANTS, { or: orFilter, select: 'trait_id, name' }, 'LibraryLoader.loadTraitsVariants'),
                DatabaseService.fetchAll<DBSkillVariant>(TABLE_LIBRARIES_SKILLS_VARIANTS, { or: orFilter, select: 'skill_id, name' }, 'LibraryLoader.loadSkillsVariants'),
                DatabaseService.fetchAll<DBBackgroundVariant>(TABLE_LIBRARIES_BACKGROUNDS_VARIANTS, { or: orFilter, select: 'background_id, name' }, 'LibraryLoader.loadBgVariants'),
                DatabaseService.fetchAll<DBMysticAbility>(TABLE_LIBRARIES_MYSTIC_ABILITIES, { or: orFilter }, 'LibraryLoader.loadMystic'),
                DatabaseService.fetchAll<RelSettingMysticAbility>(TABLE_REL_SETTING_MYSTIC_ABILITIES, { eq: { setting_id: settingId } }, 'LibraryLoader.relMystic')
            ]);

            const traitVarMap = new Map<string, string[]>();
            traitVariants.forEach((v: DBTraitVariant) => {
                const list = traitVarMap.get(v.trait_id) || [];
                if (!list.includes(v.name)) {
                    list.push(v.name);
                    traitVarMap.set(v.trait_id, list);
                }
            });

            const skillVarMap = new Map<string, string[]>();
            skillVariants.forEach((v: DBSkillVariant) => {
                const list = skillVarMap.get(v.skill_id) || [];
                if (!list.includes(v.name)) {
                    list.push(v.name);
                    skillVarMap.set(v.skill_id, list);
                }
            });

            const bgVarMap = new Map<string, string[]>();
            bgVariants.forEach((v: DBBackgroundVariant) => {
                const list = bgVarMap.get(v.background_id) || [];
                if (!list.includes(v.name)) {
                    list.push(v.name);
                    bgVarMap.set(v.background_id, list);
                }
            });

            const activeTraitIds = new Set<string>(relTraits.map((r: RelSettingTrait) => r.trait_id));
            const activeSkillIds = new Set<string>(relSkills.map((r: RelSettingSkill) => r.skill_id));
            const activeSpecIds = new Set<string>(relSpecs.map((r: RelSettingSpecialization) => r.specialization_id));
            const activeBgIds = new Set<string>(relBackgrounds.map((r: RelSettingBackground) => r.background_id));
            const activeCounterIds = new Set<string>(relCounters.map((r: RelSettingCounter) => r.counter_id));
            const activeMysticIds = new Set<string>(relMysticAbilities.map((r: any) => r.mystic_ability_id));

            const skillRelMap = new Map<string, RelSettingSkill>(relSkills.map((r: RelSettingSkill) => [r.skill_id, r]));
            const bgDefaultMap = new Map<string, string>(relBackgrounds.map((r: RelSettingBackground) => [r.background_id, r.default_category]));
            const counterDefaultMap = new Map<string, string>(relCounters.map((r: RelSettingCounter) => [r.counter_id, r.default_category]));

            return {
                traits: traits.map((t: DBTrait) => LibraryMapper.mapTrait(t, activeTraitIds, settingId, traitVarMap.get(t.id))).sort((a, b) => a.name.localeCompare(b.name)),
                skills: skills.map((s: DBSkill) => LibraryMapper.mapSkill(s, activeSkillIds, settingId, skillVarMap.get(s.id), skillRelMap.get(s.id))).sort((a, b) => a.name.localeCompare(b.name)),
                specializations: specs.map((s: DBSpecialization) => LibraryMapper.mapSpec(s, activeSpecIds, settingId)).sort((a, b) => a.name.localeCompare(b.name)),
                backgrounds: backgrounds.map((b: DBBackground) => LibraryMapper.mapBackground(b, activeBgIds, settingId, bgVarMap.get(b.id), bgDefaultMap.get(b.id))).sort((a, b) => a.name.localeCompare(b.name)),
                counters: counters.map((c: DBCounter) => LibraryMapper.mapCounter(c, activeCounterIds, settingId, counterDefaultMap.get(c.id))).sort((a, b) => a.name.localeCompare(b.name)),
                mysticAbilities: mysticAbilities.map((m: any) => LibraryMapper.mapMysticAbility(m, activeMysticIds, settingId)).sort((a: any, b: any) => a.name.localeCompare(b.name))
            };
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'LibraryLoader.loadLibraries',
                userMessage: 'Erreur de chargement des bibliothèques'
            });
            return { traits: [], skills: [], specializations: [], backgrounds: [], counters: [], mysticAbilities: [] };
        }
    },

    /**
     * Get usage statistics from all settings except the current one
     */
    async loadGlobalUsage(currentSettingId: string): Promise<Record<string, number>> {
        try {
            const tables = [
                { table: TABLE_REL_SETTING_TRAITS, id: 'trait_id', cat: false },
                { table: TABLE_REL_SETTING_SKILLS, id: 'skill_id', cat: true },
                { table: TABLE_REL_SETTING_BACKGROUNDS, id: 'background_id', cat: true },
                { table: TABLE_REL_SETTING_COUNTERS, id: 'counter_id', cat: true },
                { table: TABLE_REL_SETTING_SPECIALIZATIONS, id: 'specialization_id', cat: false }
            ];

            const results = await Promise.all(tables.map(async t => {
                let query = supabase.from(t.table).select(`${t.id}, setting_id`);

                // Filter out current setting
                query = query.neq('setting_id', currentSettingId);

                // For tables with categories, count "placed" items OR items with overrides
                if (t.cat && t.table === TABLE_REL_SETTING_SKILLS) {
                    query = query.or(`default_category.not.is.null,name_override.not.is.null,description_override.not.is.null,is_variable_override.not.is.null,mystic_ability_id_override.not.is.null`);
                } else if (t.cat) {
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
        } catch (error) {
            ErrorService.handleError(error, { context: 'LibraryLoader.loadGlobalUsage', silent: true });
            return {};
        }
    }
};
