/**
 * Database table names constants.
 * Centralized here to avoid magic strings and ensure consistency across services.
 */

// Main tables
export const TABLE_GAME_SETTINGS = 'game_settings' as const;
export const TABLE_ATTRIBUTE_PRESETS = 'attribute_presets' as const;

// Library tables
export const TABLE_LIBRARIES_TRAITS = 'libraries_traits' as const;
export const TABLE_LIBRARIES_SKILLS = 'libraries_skills' as const;
export const TABLE_LIBRARIES_SPECIALIZATIONS = 'libraries_specializations' as const;
export const TABLE_LIBRARIES_BACKGROUNDS = 'libraries_backgrounds' as const;
export const TABLE_LIBRARIES_COUNTERS = 'libraries_counters' as const;
export const TABLE_LIBRARIES_MYSTIC_ABILITIES = 'libraries_mystic_abilities' as const;
export const TABLE_LIBRARIES_FORMULAS = 'libraries_formulas' as const;

// Relation tables
export const TABLE_REL_SETTING_TRAITS = 'rel_setting_traits' as const;
export const TABLE_REL_SETTING_SKILLS = 'rel_setting_skills' as const;
export const TABLE_REL_SETTING_SPECIALIZATIONS = 'rel_setting_specializations' as const;
export const TABLE_REL_SETTING_BACKGROUNDS = 'rel_setting_backgrounds' as const;
export const TABLE_REL_SETTING_COUNTERS = 'rel_setting_counters' as const;
export const TABLE_REL_SETTING_MYSTIC_ABILITIES = 'rel_setting_mystic_abilities' as const;
export const TABLE_REL_SETTING_FORMULAS = 'rel_setting_formulas' as const;

// Variant tables
export const TABLE_LIBRARIES_TRAITS_VARIANTS = 'libraries_traits_variants' as const;
export const TABLE_LIBRARIES_SKILLS_VARIANTS = 'libraries_skills_variants' as const;
export const TABLE_LIBRARIES_BACKGROUNDS_VARIANTS = 'libraries_backgrounds_variants' as const;

/**
 * Configuration for generic library operations.
 * Maps library keys (e.g., 'skills') to their primary tables, relations, IDs, and variants.
 */
export const LIBRARY_TYPE_CONFIG = [
    { key: 'mysticAbilities' as const, table: TABLE_LIBRARIES_MYSTIC_ABILITIES, rel: TABLE_REL_SETTING_MYSTIC_ABILITIES, idKey: 'mystic_ability_id' },
    { key: 'traits' as const, table: TABLE_LIBRARIES_TRAITS, rel: TABLE_REL_SETTING_TRAITS, idKey: 'trait_id', variants: TABLE_LIBRARIES_TRAITS_VARIANTS },
    { key: 'skills' as const, table: TABLE_LIBRARIES_SKILLS, rel: TABLE_REL_SETTING_SKILLS, idKey: 'skill_id', variants: TABLE_LIBRARIES_SKILLS_VARIANTS },
    { key: 'backgrounds' as const, table: TABLE_LIBRARIES_BACKGROUNDS, rel: TABLE_REL_SETTING_BACKGROUNDS, idKey: 'background_id', variants: TABLE_LIBRARIES_BACKGROUNDS_VARIANTS },
    { key: 'counters' as const, table: TABLE_LIBRARIES_COUNTERS, rel: TABLE_REL_SETTING_COUNTERS, idKey: 'counter_id' },
    { key: 'specializations' as const, table: TABLE_LIBRARIES_SPECIALIZATIONS, rel: TABLE_REL_SETTING_SPECIALIZATIONS, idKey: 'specialization_id' },
    { key: 'formulas' as const, table: TABLE_LIBRARIES_FORMULAS, rel: TABLE_REL_SETTING_FORMULAS, idKey: 'formula_id' }
] as const;

export type LibraryTypeKey = typeof LIBRARY_TYPE_CONFIG[number]['key'];
