import { INITIAL_DATA } from '../../data/initialState';
import { LibrarySkillEntry } from '../../types';
import { MigratableData } from './registry';

/**
 * Map of legacy skill category IDs to generic IDs
 */
export const LEGACY_SKILL_MAP: Record<string, string> = {
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

/**
 * Required skill category IDs
 */
export const REQUIRED_SKILL_CATS = [
    'Col_Comp_1', 'Col_Comp_2', 'Col_Comp_3', 'Col_Comp_4',
    'Col_Comp_5', 'Col_Comp_6', 'Col_Comp_7', 'Col_Comp_8', 'Col_Comp_9'
];

/**
 * Migration: Skills
 * - Migrate legacy category IDs to generic IDs (Col_Comp_x) FIRST
 * - Initialize missing skill categories from INITIAL_DATA
 * - Add creationValue property to skills
 * - Fix variable skills using skillLibrary
 */
export const migrateSkills = (parsed: MigratableData): void => {
    // Initialize skills object
    if (!parsed.skills) {
        parsed.skills = {};
    }

    const rawSkills = parsed.skills as Record<string, unknown[]>;

    // STEP 1: Migrate legacy skill category keys FIRST
    Object.keys(LEGACY_SKILL_MAP).forEach(oldKey => {
        if (rawSkills[oldKey]) {
            const newKey = LEGACY_SKILL_MAP[oldKey];
            if (!rawSkills[newKey]) {
                rawSkills[newKey] = rawSkills[oldKey];
            }
            delete rawSkills[oldKey];
        }
    });

    // STEP 2: Inject from INITIAL_DATA only for truly missing categories
    Object.keys(INITIAL_DATA.skills).forEach(key => {
        if (!rawSkills[key]) {
            rawSkills[key] = INITIAL_DATA.skills[key];
        }
    });

    // STEP 3: Ensure all required categories exist
    REQUIRED_SKILL_CATS.forEach(cat => {
        if (!rawSkills[cat]) {
            rawSkills[cat] = INITIAL_DATA.skills[cat] || [];
        }
    });

    // STEP 4: Ensure all skills have creationValue
    const ensureCreationValue = (list: unknown[]) => {
        return list.map(itemRaw => {
            const item = itemRaw as { creationValue?: number };
            if (item && typeof item.creationValue === 'undefined') {
                return { ...item, creationValue: 0 };
            }
            return item;
        });
    };

    Object.keys(rawSkills).forEach(key => {
        if (Array.isArray(rawSkills[key])) {
            rawSkills[key] = ensureCreationValue(rawSkills[key]);
        }
    });

    // STEP 5: Fix variable skills using skillLibrary as Source of Truth
    const skillLibrary = parsed.skillLibrary as LibrarySkillEntry[] | undefined;
    if (skillLibrary) {
        const variableSkillNames = new Set<string>();
        skillLibrary.forEach((s: LibrarySkillEntry) => {
            if (s.isVariable) {
                variableSkillNames.add(s.name.trim().toLowerCase());
            }
        });

        Object.keys(rawSkills).forEach(key => {
            if (Array.isArray(rawSkills[key])) {
                rawSkills[key] = rawSkills[key].map(skillRaw => {
                    const skill = skillRaw as { name?: string; variant?: string };
                    if (!skill || !skill.name) return skill;
                    const normalized = skill.name.trim().toLowerCase();
                    if (variableSkillNames.has(normalized) && typeof skill.variant === 'undefined') {
                        return { ...skill, variant: "" };
                    }
                    return skill;
                });
            }
        });
    }
};
