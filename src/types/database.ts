import { TraitEffect } from './primitives';

/**
 * Database model for traits (avantages/défauts)
 */
export interface DBTrait {
    id: string;
    setting_id: string | null; // Global if null
    name: string;
    description?: string;
    cost?: string;
    points_label?: string;   // Label for multiple costs (ex: "1, 3, 5" or "1-5")
    is_variable_cost?: boolean;
    category?: string;
    type?: string;           // 'avantage' | 'desavantage'
    tags?: string[];
    is_variable?: boolean;
    effects?: TraitEffect[];         // JSONB: List of effects
    created_at?: string;
    updated_at?: string;
}

/**
 * Database model for skills (compétences)
 */
export interface DBSkill {
    id: string;
    setting_id: string | null;
    name: string;
    description?: string;
    defaultCategory?: string; // Default placement
    is_variable?: boolean;
    default_min_level?: number;
    mystic_ability_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface DBMysticAbility {
    id: string;
    setting_id: string | null;
    name: string;
    description?: string;
    is_variable?: boolean;
    default_category?: string;
    created_at?: string;
    updated_at?: string;
}

export interface DBSpecialization {
    id: string;
    setting_id: string | null;
    name: string;
    description?: string;
    skill_ids: string[];
    default_min_level: number;
    created_at?: string;
    updated_at?: string;
}

/**
 * Database model for backgrounds (arrières-plans)
 */
export interface DBBackground {
    id: string;
    setting_id: string | null;
    name: string;
    description?: string;
    defaultCategory?: string;
    is_variable?: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Database model for counters (compteurs)
 */
export interface DBCounter {
    id: string;
    setting_id: string | null;
    name: string;
    description?: string;
    maxValue?: number;
    defaultValue?: number;
    xpCost?: number;
    defaultCategory?: string;
    appearance?: 'squares_only' | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Database model for game settings/campaigns
 */
export interface DBGameSetting {
    id: string;
    name: string;
    version: string;
    last_updated: string;
    configurations: Record<string, any>; // JSONB
    definitions: Record<string, any>; // JSONB
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Relationship: Settings to Traits
 */
export interface RelSettingTrait {
    setting_id: string;
    trait_id: string;
    is_active: boolean;
}

/**
 * Relationship: Settings to Skills
 */
export interface RelSettingSkill {
    setting_id: string;
    skill_id: string;
    default_category: string;
    is_active: boolean;
    name_override?: string;
    is_variable_override?: boolean;
    mystic_ability_id_override?: string;
    description_override?: string;
}

/**
 * Relationship: Settings to Backgrounds
 */
export interface RelSettingBackground {
    setting_id: string;
    background_id: string;
    default_category: string;
    is_active: boolean;
}

/**
 * Relationship: Settings to Counters
 */
export interface RelSettingCounter {
    setting_id: string;
    counter_id: string;
    default_category: string;
    is_active: boolean;
}

/**
 * Relationship: Settings to Specializations
 */
export interface RelSettingSpecialization {
    setting_id: string;
    specialization_id: string;
    is_active: boolean;
}

export interface RelSettingMysticAbility {
    setting_id: string;
    mystic_ability_id: string;
    is_active: boolean;
    default_category?: string;
}

/**
 * Trait variant names (aliases)
 */
export interface DBTraitVariant {
    id: string;
    setting_id: string | null;
    trait_id: string;
    name: string;
}

/**
 * Skill variant names (aliases)
 */
export interface DBSkillVariant {
    id: string;
    setting_id: string | null;
    skill_id: string;
    name: string;
}

/**
 * Background variant names (aliases)
 */
export interface DBBackgroundVariant {
    id: string;
    setting_id: string | null;
    background_id: string;
    name: string;
}
