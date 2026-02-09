import { LibraryBackgroundEntry, LibraryCounterEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryEntry as LibraryTraitEntry } from '../../types/system';

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
    mapTrait: (t: any, activeIds: Set<string>, sid: string, variants: string[] = []): LibraryTraitEntry => ({
        id: t.id,
        type: t.type,
        name: t.name,
        cost: t.cost,
        description: t.description,
        tags: t.tags || [],
        isVariable: t.is_variable,
        // variants is in System Type but checking if it aligns with LibraryEntry
        variants: variants,
        effects: t.effects || [],
        isGlobal: t.setting_id === null,
        isActive: activeIds.has(t.id) || t.setting_id === sid
    }),

    mapSkill: (s: any, activeIds: Set<string>, sid: string, variants: string[] = []): LibrarySkillEntry => ({
        id: s.id,
        name: s.name,
        description: s.description,
        defaultCategory: legacySkillMap[s.default_category] || s.default_category,
        isVariable: s.is_variable,
        variants: variants,
        isGlobal: s.setting_id === null,
        isActive: activeIds.has(s.id) || s.setting_id === sid
    }),

    mapSpec: (s: any, activeIds: Set<string>, sid: string): LibrarySpecializationEntry => ({
        id: s.id,
        name: s.name,
        description: s.description,
        skillIds: s.skill_ids || [],
        defaultMinLevel: s.default_min_level,
        isGlobal: s.setting_id === null,
        isActive: activeIds.has(s.id) || s.setting_id === sid
    }),

    mapBackground: (b: any, activeIds: Set<string>, sid: string, variants: string[] = []): LibraryBackgroundEntry => ({
        id: b.id,
        name: b.name,
        description: b.description,
        isVariable: b.is_variable,
        variants: variants,
        isGlobal: b.setting_id === null,
        isActive: activeIds.has(b.id) || b.setting_id === sid
    }),

    mapCounter: (c: any, activeIds: Set<string>, sid: string): LibraryCounterEntry => ({
        id: c.id,
        name: c.name,
        description: c.description,
        maxValue: c.max_value,
        defaultValue: c.default_value,
        xpCost: c.xp_cost,
        isGlobal: c.setting_id === null,
        isActive: activeIds.has(c.id) || c.setting_id === sid
    })
};
