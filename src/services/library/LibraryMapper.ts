import { LibraryBackgroundEntry, LibraryCounterEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryEntry as LibraryTraitEntry } from '../../types/system';
import { DBTrait, DBSkill, DBSpecialization, DBBackground, DBCounter, DBMysticAbility } from '../../types/database';


const legacySkillMap: Record<string, string> = {
    'talents': 'Col_Comp_1',
    'competences': 'Col_Comp_2',
    'competences_col_2': 'Col_Comp_3',
    'connaissances': 'Col_Comp_4',
    'autres_competences': 'Col_Comp_5',
    'competences2': 'Col_Comp_6',
    'autres': 'Col_Comp_7',
    'arrieres_plans': 'Col_Comp_8',
    'counters': 'Col_Comp_9'
};

export const LibraryMapper = {
    mapTrait: (t: DBTrait, activeIds: Set<string>, sid: string, variants: string[] = []): LibraryTraitEntry => ({
        id: t.id,
        type: (t.type || 'avantage') as 'avantage' | 'desavantage',
        name: t.name,
        cost: String(t.points || '0'),
        description: t.description || '',
        tags: t.tags || [],
        isVariable: t.is_variable || false,
        variants: variants,
        effects: t.effects || [],
        isGlobal: t.setting_id == null,
        isActive: activeIds.has(t.id) || t.setting_id === sid
    }),

    mapSkill: (s: DBSkill, activeIds: Set<string>, sid: string, variants: string[] = [], rel?: any): LibrarySkillEntry => {
        const isCustomized = !!(rel?.name_override || rel?.description_override || rel?.is_variable_override !== undefined || rel?.mystic_ability_id_override);

        return {
            id: s.id,
            name: rel?.name_override || s.name,
            description: rel?.description_override || s.description || '',
            defaultCategory: legacySkillMap[rel?.default_category || ''] || rel?.default_category || s.defaultCategory,
            isVariable: rel?.is_variable_override !== undefined ? rel.is_variable_override : (s.is_variable || false),
            variants: variants,
            isGlobal: s.setting_id == null,
            isActive: activeIds.has(s.id) || s.setting_id === sid,
            mysticAbilityId: rel?.mystic_ability_id_override || s.mystic_ability_id,
            isCustomized,
            masterDefinition: isCustomized ? {
                name: s.name,
                description: s.description || '',
                isVariable: s.is_variable || false,
                mysticAbilityId: s.mystic_ability_id
            } : undefined
        };
    },

    mapMysticAbility: (m: DBMysticAbility, activeIds: Set<string>, sid: string): LibrarySkillEntry => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        isVariable: m.is_variable || false,
        isGlobal: m.setting_id == null,
        isActive: activeIds.has(m.id) || m.setting_id === sid
    }),

    mapSpec: (s: DBSpecialization, activeIds: Set<string>, sid: string): LibrarySpecializationEntry => ({
        id: s.id,
        name: s.name,
        description: s.description,
        skillIds: s.skill_ids || [],
        defaultMinLevel: s.default_min_level || 1,
        isGlobal: s.setting_id == null,
        isActive: activeIds.has(s.id) || s.setting_id === sid
    }),

    mapBackground: (b: DBBackground, activeIds: Set<string>, sid: string, variants: string[] = [], localDefaultCategory?: string): LibraryBackgroundEntry => {
        const isCustomized = false; // Backgrounds customization not yet fully enabled in UI similarly to skills
        return {
            id: b.id,
            name: b.name,
            description: b.description,
            defaultCategory: localDefaultCategory,
            isVariable: b.is_variable || false,
            variants: variants,
            isGlobal: b.setting_id == null,
            isActive: activeIds.has(b.id) || b.setting_id === sid,
            isCustomized: false
        };
    },

    mapCounter: (c: DBCounter, activeIds: Set<string>, sid: string, localDefaultCategory?: string): LibraryCounterEntry => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        maxValue: c.maxValue ?? 10,
        defaultValue: c.defaultValue ?? 0,
        xpCost: c.xpCost ?? 0,
        defaultCategory: localDefaultCategory || c.defaultCategory,
        isGlobal: c.setting_id == null,
        isActive: activeIds.has(c.id) || c.setting_id === sid
    })
};
