import { supabase } from '../supabase';
import { DatabaseService } from '../DatabaseService';
import { RulesData } from '../../types/rules';
import { LibraryMapper } from './LibraryMapper';
import { ErrorService } from '../ErrorService';
import {
    DBTrait, DBSkill, DBSpecialization, DBBackground, DBCounter, DBMysticAbility, DBFormula,
    RelSettingTrait, RelSettingSkill, RelSettingSpecialization,
    RelSettingBackground, RelSettingCounter, RelSettingMysticAbility, RelSettingFormula,
    DBTraitVariant, DBSkillVariant, DBBackgroundVariant
} from '../../types/database';
import { ItemUsageDetail } from '../../types/usageTypes';
import {
    TABLE_LIBRARIES_TRAITS, TABLE_LIBRARIES_SKILLS, TABLE_LIBRARIES_SPECIALIZATIONS, TABLE_LIBRARIES_BACKGROUNDS, TABLE_LIBRARIES_COUNTERS, TABLE_LIBRARIES_MYSTIC_ABILITIES, TABLE_LIBRARIES_FORMULAS,
    TABLE_REL_SETTING_TRAITS, TABLE_REL_SETTING_SKILLS, TABLE_REL_SETTING_SPECIALIZATIONS, TABLE_REL_SETTING_BACKGROUNDS, TABLE_REL_SETTING_COUNTERS, TABLE_REL_SETTING_MYSTIC_ABILITIES, TABLE_REL_SETTING_FORMULAS,
    TABLE_LIBRARIES_TRAITS_VARIANTS, TABLE_LIBRARIES_SKILLS_VARIANTS, TABLE_LIBRARIES_BACKGROUNDS_VARIANTS
} from '../../constants/db';

export const LibraryLoader = {
    /**
     * Load libraries for a specific setting and map them to RulesData format
     */
    async loadLibraries(settingId: string): Promise<RulesData['libraries']> {
        try {
            // 1. Fetch Relations first to identify what belongs to this campaign
            const [
                relTraits, relSkills, relSpecs, relBackgrounds, relCounters, relMysticAbilities, relFormulas
            ] = await Promise.all([
                DatabaseService.fetchAll<RelSettingTrait>(TABLE_REL_SETTING_TRAITS, { eq: { setting_id: settingId } }, 'LibraryLoader.relTraits'),
                DatabaseService.fetchAll<RelSettingSkill>(TABLE_REL_SETTING_SKILLS, { eq: { setting_id: settingId } }, 'LibraryLoader.relSkills'),
                DatabaseService.fetchAll<RelSettingSpecialization>(TABLE_REL_SETTING_SPECIALIZATIONS, { eq: { setting_id: settingId } }, 'LibraryLoader.relSpecs'),
                DatabaseService.fetchAll<RelSettingBackground>(TABLE_REL_SETTING_BACKGROUNDS, { eq: { setting_id: settingId } }, 'LibraryLoader.relBackgrounds'),
                DatabaseService.fetchAll<RelSettingCounter>(TABLE_REL_SETTING_COUNTERS, { eq: { setting_id: settingId } }, 'LibraryLoader.relCounters'),
                DatabaseService.fetchAll<RelSettingMysticAbility>(TABLE_REL_SETTING_MYSTIC_ABILITIES, { eq: { setting_id: settingId } }, 'LibraryLoader.relMystic'),
                DatabaseService.fetchAll<RelSettingFormula>(TABLE_REL_SETTING_FORMULAS, { eq: { setting_id: settingId } }, 'LibraryLoader.relFormulas')
            ]);

            const traitIds = relTraits.map(r => r.trait_id);
            const skillIdsList = relSkills.map(r => r.skill_id);
            const specIds = relSpecs.map(r => r.specialization_id);
            const bgIds = relBackgrounds.map(r => r.background_id);
            const counterIds = relCounters.map(r => r.counter_id);
            const mysticIds = relMysticAbilities.map(r => r.mystic_ability_id);
            const formulaIds = relFormulas.map(r => r.formula_id);

            // 2. Fetch Reference Tables (First pass: items that don't depend on others being loaded)
            const buildFilter = (ids: string[]) => {
                const parts = [`setting_id.eq.${settingId}`];
                if (ids && ids.length > 0) {
                    // Filter out invalid or duplicate IDs to keep the query string safe
                    const validIds = Array.from(new Set(ids.filter(id => id && id.length === 36)));
                    if (validIds.length > 0) {
                        parts.push(`id.in.(${validIds.join(',')})`);
                    }
                }
                return parts.join(',');
            };

            const [
                traits, specs, backgrounds, counters, mysticAbilities, formulas
            ] = await Promise.all([
                DatabaseService.fetchAll<DBTrait>(TABLE_LIBRARIES_TRAITS, { or: buildFilter(traitIds) }, 'LibraryLoader.loadTraits'),
                DatabaseService.fetchAll<DBSpecialization>(TABLE_LIBRARIES_SPECIALIZATIONS, { or: buildFilter(specIds) }, 'LibraryLoader.loadSpecs'),
                DatabaseService.fetchAll<DBBackground>(TABLE_LIBRARIES_BACKGROUNDS, { or: buildFilter(bgIds) }, 'LibraryLoader.loadBackgrounds'),
                DatabaseService.fetchAll<DBCounter>(TABLE_LIBRARIES_COUNTERS, { or: buildFilter(counterIds) }, 'LibraryLoader.loadCounters'),
                DatabaseService.fetchAll<DBMysticAbility>(TABLE_LIBRARIES_MYSTIC_ABILITIES, { or: buildFilter(mysticIds) }, 'LibraryLoader.loadMystic'),
                DatabaseService.fetchAll<DBFormula>(TABLE_LIBRARIES_FORMULAS, { or: buildFilter(formulaIds) }, 'LibraryLoader.loadFormulas')
            ]);

            // 3. Second pass: Load Skills (merge explicitly linked skills AND skills referenced by loaded specializations)
            const allNeededSkillIds = new Set(skillIdsList);
            specs.forEach(s => {
                if (s.skill_ids && Array.isArray(s.skill_ids)) {
                    s.skill_ids.forEach(id => {
                        if (id) allNeededSkillIds.add(id);
                    });
                }
            });

            // Also check if some mystic abilities were referenced as skills (unlikely but safe)
            // If they are regular skills, we need them in the skills fetch.

            const skillIdsToFetch = Array.from(allNeededSkillIds);

            const [
                skills,
                traitVariants,
                skillVariants,
                bgVariants
            ] = await Promise.all([
                DatabaseService.fetchAll<DBSkill>(TABLE_LIBRARIES_SKILLS, { or: buildFilter(skillIdsToFetch) }, 'LibraryLoader.loadSkills'),
                DatabaseService.fetchAll<DBTraitVariant>(TABLE_LIBRARIES_TRAITS_VARIANTS, { or: buildFilter(traitIds), select: 'trait_id, name' }, 'LibraryLoader.loadTraitsVariants'),
                DatabaseService.fetchAll<DBSkillVariant>(TABLE_LIBRARIES_SKILLS_VARIANTS, { or: buildFilter(skillIdsToFetch), select: 'skill_id, name' }, 'LibraryLoader.loadSkillsVariants'),
                DatabaseService.fetchAll<DBBackgroundVariant>(TABLE_LIBRARIES_BACKGROUNDS_VARIANTS, { or: buildFilter(bgIds), select: 'background_id, name' }, 'LibraryLoader.loadBgVariants')
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

            const activeTraitIds = new Set<string>(relTraits.filter((r: RelSettingTrait) => r.is_active).map((r: RelSettingTrait) => r.trait_id));
            const activeSkillIds = new Set<string>(relSkills.filter((r: RelSettingSkill) => r.is_active).map((r: RelSettingSkill) => r.skill_id));
            const activeSpecIds = new Set<string>(relSpecs.filter((r: RelSettingSpecialization) => r.is_active).map((r: RelSettingSpecialization) => r.specialization_id));
            const activeBgIds = new Set<string>(relBackgrounds.filter((r: RelSettingBackground) => r.is_active).map((r: RelSettingBackground) => r.background_id));
            const activeCounterIds = new Set<string>(relCounters.filter((r: RelSettingCounter) => r.is_active).map((r: RelSettingCounter) => r.counter_id));
            const activeMysticIds = new Set<string>(relMysticAbilities.filter((r: any) => r.is_active).map((r: any) => r.mystic_ability_id));
            const activeFormulaIds = new Set<string>(relFormulas.filter((r: RelSettingFormula) => r.is_active).map((r: RelSettingFormula) => r.formula_id));

            const skillRelMap = new Map<string, RelSettingSkill>(relSkills.map((r: RelSettingSkill) => [r.skill_id, r]));
            const bgDefaultMap = new Map<string, string>(relBackgrounds.map((r: RelSettingBackground) => [r.background_id, r.default_category]));
            const counterDefaultMap = new Map<string, string>(relCounters.map((r: RelSettingCounter) => [r.counter_id, r.default_category]));
            const mysticRelMap = new Map<string, any>(relMysticAbilities.map((r: any) => [r.mystic_ability_id, r]));
            const mysticDefaultMap = new Map<string, string>(relMysticAbilities.map((r: any) => [r.mystic_ability_id, r.default_category]));

            return {
                traits: traits.map((t: DBTrait) => LibraryMapper.mapTrait(t, activeTraitIds, settingId, traitVarMap.get(t.id))).sort((a, b) => a.name.localeCompare(b.name)),
                skills: skills.map((s: DBSkill) => LibraryMapper.mapSkill(s, activeSkillIds, settingId, skillVarMap.get(s.id), skillRelMap.get(s.id))).sort((a, b) => a.name.localeCompare(b.name)),
                specializations: specs.map((s: DBSpecialization) => LibraryMapper.mapSpec(s, activeSpecIds, settingId)).sort((a, b) => a.name.localeCompare(b.name)),
                backgrounds: backgrounds.map((b: DBBackground) => LibraryMapper.mapBackground(b, activeBgIds, settingId, bgVarMap.get(b.id), bgDefaultMap.get(b.id))).sort((a, b) => a.name.localeCompare(b.name)),
                counters: counters.map((c: DBCounter) => LibraryMapper.mapCounter(c, activeCounterIds, settingId, counterDefaultMap.get(c.id))).sort((a, b) => a.name.localeCompare(b.name)),
                mysticAbilities: mysticAbilities.map((m: any) => LibraryMapper.mapMysticAbility(m, activeMysticIds, settingId, mysticDefaultMap.get(m.id))).sort((a: any, b: any) => a.name.localeCompare(b.name)),
                formulas: (formulas || []).map((f: DBFormula) => LibraryMapper.mapFormula(f, activeFormulaIds, settingId)).sort((a, b) => a.name.localeCompare(b.name))
            };
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'LibraryLoader.loadLibraries',
                userMessage: 'Erreur de chargement des bibliothèques'
            });
            return { traits: [], skills: [], specializations: [], backgrounds: [], counters: [], mysticAbilities: [], formulas: [] };
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
                { table: TABLE_REL_SETTING_SPECIALIZATIONS, id: 'specialization_id', cat: false },
                { table: TABLE_REL_SETTING_MYSTIC_ABILITIES, id: 'mystic_ability_id', cat: true },
                { table: TABLE_REL_SETTING_FORMULAS, id: 'formula_id', cat: false }
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
    },

    /**
     * Load detailed usage information for a specific item (campaigns and characters)
     */
    async loadItemUsageDetails(
        itemId: string,
        currentSettingId: string,
        itemType: 'trait' | 'skill' | 'background' | 'counter' | 'mystic' | 'specialization' | 'formula'
    ): Promise<ItemUsageDetail> {
        try {
            // 1. Determine rel table and columns
            let relTable = '';
            let idColumn = '';

            switch (itemType) {
                case 'trait': relTable = TABLE_REL_SETTING_TRAITS; idColumn = 'trait_id'; break;
                case 'skill': relTable = TABLE_REL_SETTING_SKILLS; idColumn = 'skill_id'; break;
                case 'background': relTable = TABLE_REL_SETTING_BACKGROUNDS; idColumn = 'background_id'; break;
                case 'counter': relTable = TABLE_REL_SETTING_COUNTERS; idColumn = 'counter_id'; break;
                case 'mystic': relTable = TABLE_REL_SETTING_MYSTIC_ABILITIES; idColumn = 'mystic_ability_id'; break;
                case 'specialization': relTable = TABLE_REL_SETTING_SPECIALIZATIONS; idColumn = 'specialization_id'; break;
                case 'formula': relTable = TABLE_REL_SETTING_FORMULAS; idColumn = 'formula_id'; break;
            }

            if (!relTable) return { settings: [], characters: [] };

            // 2. Fetch campaign usage
            let query = supabase
                .from(relTable)
                .select(`setting_id, game_settings!inner(name)`)
                .eq(idColumn, itemId);

            if (currentSettingId && currentSettingId !== 'global') {
                query = query.neq('setting_id', currentSettingId);
            }

            const { data: settingsData, error: settingsError } = await query;

            if (settingsError) throw settingsError;

            const settings = (settingsData || []).map((row: any) => ({
                id: row.setting_id,
                name: row.game_settings.name
            }));

            // 3. Fetch character usage (focus on traits for now as it's the most common/tracable)
            let characters: any[] = [];
            if (itemType === 'trait') {
                const { data: charData, error: charError } = await supabase
                    .from('characters')
                    .select('character_name, player_name, game_settings(name)')
                    .or(`data->page2->avantages->0->>definitionId.eq.${itemId},data->page2->desavantages->0->>definitionId.eq.${itemId}`);

                // Note: The above .or with JSONB arrow is a bit limited in Supabase JS (only checks first element).
                // For a more robust solution in a real app, we would use .contains() but it requires the whole JSON path match.
                // Given the constraints, we will at least return the campaigns which is the primary lock source.

                if (!charError && charData) {
                    characters = charData.map(c => ({
                        name: c.character_name,
                        player: c.player_name,
                        settingName: (c.game_settings as any)?.name
                    }));
                }
            }

            return {
                settings,
                characters
            };
        } catch (error) {
            ErrorService.handleError(error, { context: 'LibraryLoader.loadItemUsageDetails', silent: true });
            return { settings: [], characters: [] };
        }
    }
};
