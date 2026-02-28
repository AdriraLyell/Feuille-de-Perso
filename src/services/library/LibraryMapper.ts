import { LibraryBackgroundEntry, LibraryCounterEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryFormulaEntry, LibraryEntry as LibraryTraitEntry } from '../../types/system';
import { DBTrait, DBSkill, DBSpecialization, DBBackground, DBCounter, DBMysticAbility, DBFormula } from '../../types/database';


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
        cost: t.cost || '0',
        pointsLabel: t.points_label || t.cost || '0',
        isVariableCost: t.is_variable_cost || false,
        description: t.description || '',
        tags: t.tags || [],
        isVariable: t.is_variable || false,
        hasAutoCounter: t.has_auto_counter || false,
        autoCounterName: t.auto_counter_name,
        isXPUpgradeable: t.is_xp_upgradeable || false,
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
            isVariable: (rel?.is_variable_override !== undefined && rel?.is_variable_override !== null) ? rel.is_variable_override : (s.is_variable || false),
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

    mapMysticAbility: (m: DBMysticAbility, activeIds: Set<string>, sid: string, localDefaultCategory?: string): LibrarySkillEntry => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        defaultCategory: legacySkillMap[localDefaultCategory || ''] || localDefaultCategory || legacySkillMap[m.default_category || ''] || m.default_category,
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
        maxValue: (c as any).max_value ?? c.maxValue ?? 10,
        defaultValue: (c as any).default_value ?? c.defaultValue ?? 0,
        xpCost: (c as any).xp_cost ?? c.xpCost ?? 0,
        appearance: c.appearance || null,
        formulaId: c.formula_id,
        defaultCategory: localDefaultCategory || c.defaultCategory || (c as any).default_category,
        isGlobal: c.setting_id == null,
        isActive: activeIds.has(c.id) || c.setting_id === sid
    }),
    mapFormula: (f: DBFormula, activeIds: Set<string>, sid: string): LibraryFormulaEntry => {
        let type: 'modifier' | 'variable' = 'variable';
        if (f.type === 'effect' || f.type === 'modifier') type = 'modifier';
        else if (f.type === 'reserve' || f.type === 'variable') type = 'variable';

        return {
            id: f.id,
            name: f.name,
            code: f.code,
            formula: f.formula,
            type: type,
            aggregateConfig: f.aggregate_config,
            target: f.target,
            effectType: f.effect_type,
            operator: f.operator as 'ADD' | 'SET' | 'SUB' | '',
            forceVariant: f.force_variant || false,
            description: f.description || '',
            isGlobal: f.setting_id == null,
            isActive: activeIds.has(f.id) || f.setting_id === sid
        };
    }
};
